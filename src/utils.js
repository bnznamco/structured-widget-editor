export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const clone = {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

export function getDefaultForSchema(schema) {
  if ('default' in schema) return deepClone(schema.default);
  if (schema.type === 'object') {
    const obj = {};
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      if ('default' in prop) obj[key] = deepClone(prop.default);
      else if (prop.type === 'string') obj[key] = '';
      else if (prop.type === 'integer' || prop.type === 'number') obj[key] = 0;
      else if (prop.type === 'boolean') obj[key] = false;
      else if (prop.type === 'array') obj[key] = [];
    }
    return obj;
  }
  if (schema.type === 'array') return [];
  if (schema.type === 'string') return '';
  if (schema.type === 'integer' || schema.type === 'number') return 0;
  if (schema.type === 'boolean') return false;
  if (schema.type === 'relation') return schema.multiple ? [] : null;
  return null;
}
