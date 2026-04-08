// JSON Schema conditional evaluation for form rendering.
//
// Supports the standard keywords: `if`/`then`/`else`, `allOf` of those,
// `dependentSchemas`, and `dependentRequired`. The matcher implements the
// subset of JSON Schema validation that is meaningful for form-time
// conditionals on object properties:
//
//   - `properties: { field: { const, enum, type, not } }`
//   - `required: [...]` (treated as "key is present and not null/undefined")
//   - `not`, `allOf`, `anyOf`, `oneOf` (recursive)
//
// The functions are pure: they take a schema + value and return an
// "effective schema" with `properties`/`required` merged from any matching
// branches. The renderer uses that effective schema instead of the raw one.

function isPresent(value, key) {
  if (value == null || typeof value !== 'object') return false;
  if (!(key in value)) return false;
  const v = value[key];
  return v !== undefined && v !== null && v !== '';
}

function matchesPropertyConstraint(value, constraint) {
  if (!constraint || typeof constraint !== 'object') return true;
  if ('const' in constraint) return value === constraint.const;
  if (Array.isArray(constraint.enum)) return constraint.enum.includes(value);
  if (constraint.type) {
    const t = constraint.type;
    if (t === 'string' && typeof value !== 'string') return false;
    if (t === 'number' && typeof value !== 'number') return false;
    if (t === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) return false;
    if (t === 'boolean' && typeof value !== 'boolean') return false;
    if (t === 'null' && value !== null) return false;
    if (t === 'array' && !Array.isArray(value)) return false;
    if (t === 'object' && (value == null || typeof value !== 'object' || Array.isArray(value))) return false;
  }
  // Numeric comparators
  if (typeof value === 'number') {
    if (typeof constraint.minimum === 'number' && value < constraint.minimum) return false;
    if (typeof constraint.maximum === 'number' && value > constraint.maximum) return false;
    if (typeof constraint.exclusiveMinimum === 'number' && value <= constraint.exclusiveMinimum) return false;
    if (typeof constraint.exclusiveMaximum === 'number' && value >= constraint.exclusiveMaximum) return false;
    if (typeof constraint.multipleOf === 'number' && constraint.multipleOf > 0) {
      const q = value / constraint.multipleOf;
      if (Math.abs(q - Math.round(q)) > 1e-9) return false;
    }
  }
  // String comparators
  if (typeof value === 'string') {
    if (typeof constraint.minLength === 'number' && value.length < constraint.minLength) return false;
    if (typeof constraint.maxLength === 'number' && value.length > constraint.maxLength) return false;
    if (typeof constraint.pattern === 'string') {
      try {
        if (!new RegExp(constraint.pattern).test(value)) return false;
      } catch (e) {
        // Invalid pattern — treat as non-match rather than throwing in render path.
        return false;
      }
    }
  }
  if (constraint.not) return !matchesSchema(value, constraint.not);
  return true;
}

// Returns true if `value` (an object) satisfies the form-relevant subset of `schema`.
export function matchesSchema(value, schema) {
  if (!schema || typeof schema !== 'object') return true;

  if (Array.isArray(schema.required)) {
    for (const k of schema.required) {
      if (!isPresent(value, k)) return false;
    }
  }

  if (schema.properties && typeof schema.properties === 'object') {
    for (const [k, constraint] of Object.entries(schema.properties)) {
      // Standard JSON Schema: property constraints only apply if the key is present.
      if (value == null || !(k in value)) continue;
      if (!matchesPropertyConstraint(value[k], constraint)) return false;
    }
  }

  if (schema.not && matchesSchema(value, schema.not)) return false;
  if (Array.isArray(schema.allOf) && !schema.allOf.every((s) => matchesSchema(value, s))) return false;
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((s) => matchesSchema(value, s))) return false;
  if (Array.isArray(schema.oneOf)) {
    const matched = schema.oneOf.filter((s) => matchesSchema(value, s)).length;
    if (matched !== 1) return false;
  }

  return true;
}

function insertAfter(properties, anchorKey, newEntries) {
  // Rebuild the property map so newly-added keys appear immediately after
  // their controlling field instead of being appended to the end.
  const existingKeys = Object.keys(properties);
  const anchorIdx = anchorKey ? existingKeys.indexOf(anchorKey) : -1;
  if (anchorIdx === -1) {
    const out = { ...properties };
    for (const [k, v] of newEntries) out[k] = v;
    return out;
  }
  const out = {};
  for (let i = 0; i < existingKeys.length; i++) {
    const key = existingKeys[i];
    out[key] = properties[key];
    if (i === anchorIdx) {
      for (const [k, v] of newEntries) {
        if (!(k in properties)) out[k] = v;
      }
    }
  }
  // Any new keys that already existed in properties have been kept in place;
  // overwrite their values with the merged versions.
  for (const [k, v] of newEntries) {
    if (k in properties) out[k] = v;
  }
  return out;
}

function mergeBranch(target, branch, anchorKey) {
  if (!branch || typeof branch !== 'object') return target;

  if (branch.properties) {
    const merged = [];
    for (const [k, v] of Object.entries(branch.properties)) {
      const existing = target.properties && target.properties[k];
      merged.push([k, existing ? { ...existing, ...v } : v]);
    }
    target.properties = insertAfter(target.properties || {}, anchorKey, merged);
  }

  if (Array.isArray(branch.required)) {
    const set = new Set(target.required || []);
    for (const k of branch.required) set.add(k);
    target.required = Array.from(set);
  }

  // Conditionals can also nest more conditionals — flatten them.
  if (branch.allOf) {
    target.allOf = [...(target.allOf || []), ...branch.allOf];
  }
  if (branch.if) {
    target.allOf = [...(target.allOf || []), { if: branch.if, then: branch.then, else: branch.else }];
  }
  if (branch.dependentSchemas) {
    target.dependentSchemas = { ...(target.dependentSchemas || {}), ...branch.dependentSchemas };
  }
  if (branch.dependentRequired) {
    target.dependentRequired = { ...(target.dependentRequired || {}), ...branch.dependentRequired };
  }

  return target;
}

// Returns an effective schema for an object schema given the current value.
// Resolves `if/then/else`, `allOf` of those, `dependentSchemas`, and
// `dependentRequired`. Idempotent and safe to call on every render.
//
// `resolver` (optional) is called on each `then`/`else`/`dependentSchemas`
// branch before merging, so `$ref` inside conditional branches is followed.
// Pass `form.resolveSchema` from the renderer.
export function applyConditionals(schema, value, resolver) {
  const resolve = typeof resolver === 'function' ? resolver : (s) => s;
  if (!schema || typeof schema !== 'object') return schema;
  if (schema.type !== 'object' && !schema.properties) return schema;

  // Start with a shallow clone of the parts we may mutate.
  let effective = {
    ...schema,
    properties: { ...(schema.properties || {}) },
    required: Array.isArray(schema.required) ? [...schema.required] : [],
  };

  const safeValue = value && typeof value === 'object' ? value : {};

  // Pick the controlling field of an `if` clause so newly-added properties
  // can be inserted right after it in render order.
  const anchorOf = (ifClause) => {
    if (!ifClause || typeof ifClause !== 'object') return null;
    const props = ifClause.properties && Object.keys(ifClause.properties);
    if (props && props.length) return props[0];
    if (Array.isArray(ifClause.required) && ifClause.required.length) return ifClause.required[0];
    return null;
  };

  // Collect rules: top-level if/then/else + every entry in allOf that has one.
  const rules = [];
  if (effective.if) {
    rules.push({ if: effective.if, then: effective.then, else: effective.else, anchor: anchorOf(effective.if) });
  }
  if (Array.isArray(effective.allOf)) {
    for (const entry of effective.allOf) {
      if (entry && typeof entry === 'object' && entry.if) {
        rules.push({ if: entry.if, then: entry.then, else: entry.else, anchor: anchorOf(entry.if) });
      } else if (entry && typeof entry === 'object' && (entry.properties || entry.required)) {
        // Plain allOf branch (e.g. shared base) — always merge.
        mergeBranch(effective, entry);
      }
    }
  }

  // Iterate to a fixed point so newly-merged rules can themselves trigger further rules.
  // Capped to avoid pathological loops.
  for (let i = 0; i < 8; i++) {
    let changed = false;
    const before = JSON.stringify({ p: effective.properties, r: effective.required });

    for (const rule of rules) {
      const matched = matchesSchema(safeValue, rule.if);
      const branch = matched ? rule.then : rule.else;
      if (branch) mergeBranch(effective, resolve(branch), rule.anchor);
    }

    if (effective.dependentSchemas) {
      for (const [key, branch] of Object.entries(effective.dependentSchemas)) {
        if (isPresent(safeValue, key)) mergeBranch(effective, resolve(branch), key);
      }
    }

    if (effective.dependentRequired) {
      for (const [key, requiredKeys] of Object.entries(effective.dependentRequired)) {
        if (isPresent(safeValue, key) && Array.isArray(requiredKeys)) {
          const set = new Set(effective.required || []);
          for (const k of requiredKeys) set.add(k);
          effective.required = Array.from(set);
        }
      }
    }

    const after = JSON.stringify({ p: effective.properties, r: effective.required });
    if (after !== before) changed = true;
    if (!changed) break;
  }

  return effective;
}

// Returns true if the schema declares any form-relevant conditional logic.
export function hasConditionals(schema) {
  if (!schema || typeof schema !== 'object') return false;
  if (schema.if || schema.dependentSchemas || schema.dependentRequired) return true;
  if (Array.isArray(schema.allOf)) {
    return schema.allOf.some((e) => e && typeof e === 'object' && (e.if || e.dependentSchemas));
  }
  return false;
}
