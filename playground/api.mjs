import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const fixtures = {
  'library.Author': JSON.parse(readFileSync(join(__dirname, 'fixtures/authors.json'), 'utf8')),
  'library.Category': JSON.parse(readFileSync(join(__dirname, 'fixtures/categories.json'), 'utf8')),
  'library.Publisher': JSON.parse(readFileSync(join(__dirname, 'fixtures/publishers.json'), 'utf8')),
};

const schema = JSON.parse(readFileSync(join(__dirname, 'fixtures/schema.json'), 'utf8'));

// ---------------------------------------------------------------------------
// Search logic – mirrors django-structured-field structured/views.py
// ---------------------------------------------------------------------------
const PAGE_SIZE = 50;

function createSearchQuery(items, query) {
  const q = query.toLowerCase();
  return items.filter((item) => {
    for (const [, value] of Object.entries(item)) {
      if (typeof value === 'string' && value.toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

function searchModel(modelKey, params) {
  const items = fixtures[modelKey];
  if (!items) return { error: `No model matches "${modelKey}"`, status: 404 };

  const searchTerm = params.get('_q') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  let results;

  if (!searchTerm) {
    results = items;
  } else if (searchTerm.startsWith('_pk=')) {
    const pk = parseInt(searchTerm.split('_pk=')[1], 10);
    results = items.filter((i) => i.id === pk);
  } else if (searchTerm.startsWith('_pk__in=')) {
    const pks = searchTerm
      .split('_pk__in=')[1]
      .split(',')
      .map(Number)
      .filter(Number.isFinite);
    results = items.filter((i) => pks.includes(i.id));
  } else if (searchTerm === '__all__') {
    results = items;
  } else {
    results = createSearchQuery(items, searchTerm);
  }

  results = [...results].sort((a, b) => a.id - b.id);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = results.slice(start, start + PAGE_SIZE);

  return {
    items: pageItems,
    more: start + PAGE_SIZE < results.length,
  };
}

// ---------------------------------------------------------------------------
// Validation – mirrors django-structured-field structured/fields.py
// ---------------------------------------------------------------------------
function validateValue(value, fieldSchema, defs, path = '') {
  const errors = {};

  if (!fieldSchema || typeof fieldSchema !== 'object') return errors;

  if (fieldSchema.$ref) {
    const refName = fieldSchema.$ref.replace(/^#\/\$defs\//, '').replace(/^#\/definitions\//, '');
    const resolved = defs[refName];
    if (resolved) return validateValue(value, resolved, defs, path);
    return errors;
  }

  if (fieldSchema.anyOf) {
    const nonNull = fieldSchema.anyOf.filter((s) => s.type !== 'null');
    const hasNull = fieldSchema.anyOf.some((s) => s.type === 'null');
    if (hasNull && (value === null || value === undefined)) return errors;
    if (nonNull.length === 1) return validateValue(value, nonNull[0], defs, path);
  }

  if (fieldSchema.oneOf && fieldSchema.discriminator) {
    const disc = fieldSchema.discriminator.propertyName;
    if (value && typeof value === 'object' && value[disc]) {
      const mapping = fieldSchema.discriminator.mapping || {};
      const ref = mapping[value[disc]];
      if (ref) {
        const refName = ref.replace(/^#\/\$defs\//, '').replace(/^#\/definitions\//, '');
        const resolved = defs[refName];
        if (resolved) return validateValue(value, resolved, defs, path);
      }
    }
    return errors;
  }

  if (fieldSchema.type === 'object' && fieldSchema.properties) {
    const required = fieldSchema.required || [];
    for (const key of required) {
      const val = value?.[key];
      const propSchema = fieldSchema.properties[key];
      if (propSchema && 'const' in propSchema) continue;
      if (val === undefined || val === null || val === '') {
        const fieldPath = path ? `${path}.${key}` : key;
        errors[fieldPath] = ['This field is required.'];
      }
    }
    for (const [key, propSchema] of Object.entries(fieldSchema.properties)) {
      const val = value?.[key];
      if (val !== undefined && val !== null) {
        const childErrors = validateValue(val, propSchema, defs, path ? `${path}.${key}` : key);
        Object.assign(errors, childErrors);
      }
    }
  }

  if (fieldSchema.type === 'string' && value !== undefined && value !== null) {
    if (typeof value !== 'string') {
      errors[path || '_root'] = ['Value is not a valid string.'];
    } else if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors[path || '_root'] = [`String is too long (max ${fieldSchema.maxLength}).`];
    }
  }

  if ((fieldSchema.type === 'integer' || fieldSchema.type === 'number') && value !== undefined && value !== null) {
    if (typeof value !== 'number') {
      errors[path || '_root'] = ['Value is not a valid number.'];
    } else {
      if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
        errors[path || '_root'] = [`Value must be >= ${fieldSchema.minimum}.`];
      }
      if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
        errors[path || '_root'] = [`Value must be <= ${fieldSchema.maximum}.`];
      }
      if (fieldSchema.type === 'integer' && !Number.isInteger(value)) {
        errors[path || '_root'] = ['Value must be an integer.'];
      }
    }
  }

  if (fieldSchema.type === 'boolean' && value !== undefined && value !== null) {
    if (typeof value !== 'boolean') {
      errors[path || '_root'] = ['Value is not a valid boolean.'];
    }
  }

  if (fieldSchema.type === 'array' && value !== undefined && value !== null) {
    if (!Array.isArray(value)) {
      errors[path || '_root'] = ['Value is not a valid array.'];
    } else if (fieldSchema.items) {
      for (let i = 0; i < value.length; i++) {
        const childErrors = validateValue(value[i], fieldSchema.items, defs, path ? `${path}.${i}` : String(i));
        Object.assign(errors, childErrors);
      }
    }
  }

  if (fieldSchema.enum && value !== undefined && value !== null) {
    if (!fieldSchema.enum.includes(value)) {
      errors[path || '_root'] = [`Value must be one of: ${fieldSchema.enum.join(', ')}.`];
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Vite plugin – API middleware
// ---------------------------------------------------------------------------
export default function apiPlugin() {
  return {
    name: 'structured-field-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        // Search model
        const searchMatch = url.pathname.match(/^\/structured_field\/search_model\/([^/]+)\/?$/);
        if (searchMatch && req.method === 'GET') {
          const result = searchModel(searchMatch[1], url.searchParams);
          res.setHeader('Content-Type', 'application/json');
          if (result.error) {
            res.statusCode = result.status || 500;
          }
          res.end(JSON.stringify(result.error ? { error: result.error } : result));
          return;
        }

        // Get schema
        if (url.pathname === '/api/schema' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(schema));
          return;
        }

        // Validate
        if (url.pathname === '/api/validate' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const defs = schema.$defs || schema.definitions || {};
              const errors = validateValue(data, schema, defs);
              const valid = Object.keys(errors).length === 0;
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = valid ? 200 : 400;
              res.end(JSON.stringify({ valid, errors }));
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ valid: false, errors: { _root: ['Invalid JSON body.'] } }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
