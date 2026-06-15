import { isChoiceOneOf } from './utils';

// Field-size classification for the multicolumn flow layout.
// Sizes are flex-basis tokens (see scss/components/layout.scss), not column
// counts: columns emerge from how many cells fit the container's width.
// Invariant: visual order === DOM order === tab order. Never reorder cells.

const SIZES = ['xs', 'sm', 'md', 'lg', 'full'];
const BREAKS = ['before', 'after', 'both'];

// Schema-author hint: `layout: 'sm'` or `layout: { size: 'sm', break: 'before' }`.
// Invalid hints are silently ignored so a typo degrades to the heuristic.
export function normalizeLayoutHint(layout) {
  if (typeof layout === 'string') {
    return { size: SIZES.includes(layout) ? layout : null, break: null };
  }
  if (layout && typeof layout === 'object' && !Array.isArray(layout)) {
    return {
      size: SIZES.includes(layout.size) ? layout.size : null,
      break: BREAKS.includes(layout.break) ? layout.break : null,
    };
  }
  return { size: null, break: null };
}

// Nullable scalars carry the inline null-clear button (~30px of chrome), and
// datetime-local needs its full width — one tier of slack keeps them usable.
const NULLABLE_BUMP = { xs: 'sm', sm: 'md' };

function bumpNullable(size, schema) {
  return schema._nullable ? (NULLABLE_BUMP[size] || size) : size;
}

function choiceSize(labels, schema) {
  const compact = labels.length <= 8 && labels.every((l) => String(l ?? '').length <= 12);
  return bumpNullable(compact ? 'sm' : 'md', schema);
}

// Shared with SchemaEditor: past this depth everything renders StringEditor.
export const MAX_DEPTH = 12;

// Intrinsic size of a RESOLVED schema node.
// Returns 'xs' | 'sm' | 'md' | 'lg' | 'full' | 'hidden'.
// Hidden routing (const / single-string-enum) is authoritative: a size hint
// on a field that renders HiddenEditor would only produce an empty cell.
export function fieldSize(schema) {
  if (!schema || typeof schema !== 'object') return 'full';
  const intrinsic = intrinsicSize(schema);
  if (intrinsic === 'hidden') return 'hidden';
  return normalizeLayoutHint(schema.layout).size || intrinsic;
}

// The branch order mirrors SchemaEditor.editorComponent — keep them in sync.
function intrinsicSize(schema) {
  if (schema.type === 'relation') return schema.multiple ? 'lg' : 'md';
  if (schema.oneOf && schema.discriminator) return 'full';
  if (isChoiceOneOf(schema.oneOf)) {
    return choiceSize(schema.oneOf.map((o) => o.title ?? o.const), schema);
  }
  if ('const' in schema) return 'hidden';
  if (schema.enum && schema.enum.length === 1 && schema.type === 'string') return 'hidden';
  // Covers ObjectEditor, JsonEditor, ArrayEditor and NullableEditor containers.
  if (schema.type === 'object' || schema.type === 'array') return 'full';
  if (schema.enum) return choiceSize(schema.enum, schema);
  if (schema.type === 'boolean') return bumpNullable('xs', schema);
  if (schema.type === 'number' || schema.type === 'integer') return bumpNullable('xs', schema);
  if (schema.type === 'string') {
    if (schema.format === 'date') return bumpNullable('sm', schema);
    if (schema.format === 'date-time') return bumpNullable('md', schema);
    // Mirrors StringEditor.isLong (textarea rendering).
    if (schema.format === 'textarea' || schema.maxLength > 255) return 'full';
    if (schema.maxLength > 0 && schema.maxLength <= 40) return bumpNullable('sm', schema);
    return 'md';
  }
  return 'full';
}

// Builds the cell list for an object's properties: resolved schema, wrapper
// classes and row-break flags. `break: 'after'` marks the NEXT visible field;
// hidden fields neither consume nor emit a pending break.
// Custom-editor matches default to 'full' (we can't predict their rendering)
// unless the schema hint or the override's own `layout` says otherwise.
export function layoutCells(properties, { resolveSchema, customEditors = [], basePath = [] } = {}) {
  const cells = [];
  let pendingBreak = false;
  // Mirrors SchemaEditor: the depth guard runs before custom-editor overrides,
  // and past it every field (const included) renders a visible StringEditor.
  const pastMaxDepth = basePath.length + 1 > MAX_DEPTH;
  for (const [key, raw] of Object.entries(properties || {})) {
    const schema = resolveSchema ? resolveSchema(raw) : raw;
    const hint = normalizeLayoutHint(schema.layout);
    const override = !pastMaxDepth
      && customEditors.find((o) => o.match && o.match(schema, [...basePath, key]));
    let size;
    if (pastMaxDepth) {
      size = 'md';
    } else if (override) {
      size = hint.size || normalizeLayoutHint(override.layout).size || 'full';
    } else {
      size = fieldSize(schema);
    }
    const classes = ['sf-cell', `sf-cell-${size}`];
    // Only the plain-boolean shape reaches the label-less BooleanEditor;
    // boolean enums / choice oneOfs render SelectEditor (which has a label).
    const isCheckbox = schema.type === 'boolean' && !override && !pastMaxDepth
      && !schema.enum && !schema.oneOf && !('const' in schema);
    let breakBefore = false;
    if (size !== 'hidden') {
      if (isCheckbox) classes.push('sf-cell-bool');
      breakBefore = pendingBreak || hint.break === 'before' || hint.break === 'both';
      pendingBreak = hint.break === 'after' || hint.break === 'both';
    }
    cells.push({ key, schema, classes: classes.join(' '), breakBefore });
  }
  return cells;
}
