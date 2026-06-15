import { describe, it, expect } from 'vitest'
import { createApp, h } from 'vue'
import SchemaForm from '../src/SchemaForm.vue'
import { fieldSize, layoutCells, normalizeLayoutHint } from '../src/layout.js'

function mountForm(props) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(SchemaForm, props) })
  app.mount(el)
  return { el, app }
}

describe('normalizeLayoutHint', () => {
  it('accepts string shorthand and object form', () => {
    expect(normalizeLayoutHint('sm')).toEqual({ size: 'sm', break: null })
    expect(normalizeLayoutHint({ size: 'full', break: 'before' })).toEqual({ size: 'full', break: 'before' })
  })

  it('silently ignores invalid hints instead of throwing', () => {
    expect(normalizeLayoutHint('gigantic')).toEqual({ size: null, break: null })
    expect(normalizeLayoutHint({ size: 'sm', break: 'sideways' })).toEqual({ size: 'sm', break: null })
    expect(normalizeLayoutHint(42)).toEqual({ size: null, break: null })
    expect(normalizeLayoutHint(['sm'])).toEqual({ size: null, break: null })
    expect(normalizeLayoutHint(null)).toEqual({ size: null, break: null })
  })
})

// Shapes below are POST-resolveSchema: nullable anyOf already collapsed to the
// inner schema with _nullable, $refs resolved. One row per Book fixture field.
describe('fieldSize (table-driven over the Book fixture shapes)', () => {
  const CASES = [
    ['title (plain string)', { type: 'string' }, 'md'],
    ['description (textarea)', { type: 'string', format: 'textarea', maxLength: 2000 }, 'full'],
    ['long maxLength mirrors StringEditor.isLong (>255)', { type: 'string', maxLength: 256 }, 'full'],
    ['maxLength 255 is NOT long', { type: 'string', maxLength: 255 }, 'md'],
    ['short maxLength string', { type: 'string', maxLength: 20 }, 'sm'],
    ['pages (integer)', { type: 'integer', minimum: 1 }, 'xs'],
    ['published (boolean)', { type: 'boolean' }, 'xs'],
    ['release_date (date)', { type: 'string', format: 'date' }, 'sm'],
    ['last_reviewed_at (nullable date-time bumps to md)', { type: 'string', format: 'date-time', _nullable: true }, 'md'],
    ['status (compact enum)', { type: 'string', enum: ['draft', 'review', 'published', 'archived'] }, 'sm'],
    ['long-label enum widens', { type: 'string', enum: ['a very long option label indeed', 'b'] }, 'md'],
    ['many-option enum widens', { type: 'string', enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] }, 'md'],
    ['main_author (single relation)', { type: 'relation', multiple: false }, 'md'],
    ['co_authors (multiple relation)', { type: 'relation', multiple: true }, 'lg'],
    ['subtitle (nullable string stays md)', { type: 'string', _nullable: true }, 'md'],
    ['rating (nullable number bumps to sm)', { type: 'number', _nullable: true }, 'sm'],
    ['out_of_print (nullable boolean bumps to sm)', { type: 'boolean', _nullable: true }, 'sm'],
    ['age_rating (nullable compact enum bumps to md)', { type: 'string', enum: ['all_ages', 'teen', 'mature'], _nullable: true }, 'md'],
    ['chapters (array)', { type: 'array', items: {} }, 'full'],
    ['format (discriminated union)', { oneOf: [{}, {}], discriminator: { propertyName: 't' } }, 'full'],
    ['cover_type (choice oneOf)', { type: 'string', oneOf: [{ const: 'soft', title: 'Softcover' }, { const: 'hard', title: 'Hardcover' }] }, 'sm'],
    ['format_type (const discriminator)', { const: 'physical', default: 'physical' }, 'hidden'],
    ['single-string-enum', { type: 'string', enum: ['only'] }, 'hidden'],
    ['nested object', { type: 'object', properties: { a: {} } }, 'full'],
    ['free-form object (JsonEditor)', { type: 'object' }, 'full'],
    ['nullable object (NullableEditor)', { type: 'object', properties: {}, _nullable: true }, 'full'],
    ['unknown type', {}, 'full'],
  ]

  for (const [name, schema, expected] of CASES) {
    it(`${name} → ${expected}`, () => {
      expect(fieldSize(schema)).toBe(expected)
    })
  }

  it('explicit hint overrides the heuristic, invalid hint falls back', () => {
    expect(fieldSize({ type: 'boolean', layout: 'lg' })).toBe('lg')
    expect(fieldSize({ type: 'string', layout: { size: 'xs' } })).toBe('xs')
    expect(fieldSize({ type: 'boolean', layout: 'huge' })).toBe('xs')
  })

  it('hidden routing beats a size hint (const fields never occupy a cell)', () => {
    expect(fieldSize({ const: 'x', layout: 'sm' })).toBe('hidden')
    expect(fieldSize({ type: 'string', enum: ['only'], layout: 'md' })).toBe('hidden')
    // …but a choice-list oneOf with const members still renders a select
    expect(fieldSize({ type: 'string', layout: 'md', oneOf: [{ const: 'a', title: 'A' }, { const: 'b', title: 'B' }] })).toBe('md')
  })
})

describe('layoutCells', () => {
  it('emits cell classes, bool modifier and hidden cells', () => {
    const cells = layoutCells({
      ok: { type: 'boolean' },
      kind: { const: 'x' },
      name: { type: 'string' },
    })
    expect(cells.map(c => c.classes)).toEqual([
      'sf-cell sf-cell-xs sf-cell-bool',
      'sf-cell sf-cell-hidden',
      'sf-cell sf-cell-md',
    ])
  })

  it("break:'after' marks the next VISIBLE field; hidden fields neither consume nor emit breaks", () => {
    const cells = layoutCells({
      a: { type: 'string', layout: { break: 'after' } },
      kind: { const: 'x', layout: { break: 'after' } },
      b: { type: 'string' },
      c: { type: 'string', layout: { break: 'both' } },
    })
    const byKey = Object.fromEntries(cells.map(c => [c.key, c.breakBefore]))
    expect(byKey).toEqual({ a: false, kind: false, b: true, c: true })
  })

  it('sf-cell-bool only applies to the plain-boolean checkbox shape', () => {
    const cells = layoutCells({
      plain: { type: 'boolean' },
      asEnum: { type: 'boolean', enum: [true, false] },
      asChoice: { type: 'boolean', oneOf: [{ const: true, title: 'Yes' }, { const: false, title: 'No' }] },
    })
    expect(cells[0].classes).toContain('sf-cell-bool')
    expect(cells[1].classes).not.toContain('sf-cell-bool')
    expect(cells[2].classes).not.toContain('sf-cell-bool')
  })

  it('a const field with a size hint stays hidden and still relays pending breaks', () => {
    const cells = layoutCells({
      a: { type: 'string', layout: { break: 'after' } },
      kind: { const: 'x', layout: 'sm' },
      b: { type: 'string' },
    })
    expect(cells[1].classes).toBe('sf-cell sf-cell-hidden')
    expect(cells[2].breakBefore).toBe(true)
  })

  it('past MAX_DEPTH everything degrades to md cells (mirrors the StringEditor fallback)', () => {
    const deepPath = Array.from({ length: 12 }, (_, i) => `p${i}`)
    const cells = layoutCells(
      { kind: { const: 'x' }, flag: { type: 'boolean' } },
      { basePath: deepPath },
    )
    expect(cells[0].classes).toBe('sf-cell sf-cell-md')
    expect(cells[1].classes).toBe('sf-cell sf-cell-md')
  })

  it('custom-editor matches default to full unless the schema or override hints a size', () => {
    const customEditors = [
      { match: (s, path) => path.at(-1) === 'price', component: {} },
      { match: (s, path) => path.at(-1) === 'weight', component: {}, layout: 'sm' },
    ]
    const cells = layoutCells({
      price: { type: 'number' },
      weight: { type: 'number' },
      hinted: { type: 'number', layout: 'xs' },
    }, { customEditors })
    expect(cells[0].classes).toBe('sf-cell sf-cell-full')
    expect(cells[1].classes).toBe('sf-cell sf-cell-sm')
    expect(cells[2].classes).toBe('sf-cell sf-cell-xs')
  })
})

describe('cell rendering through SchemaForm', () => {
  it('wraps fields in sized cells, hides const cells and renders flow breaks', () => {
    const { el, app } = mountForm({
      schema: {
        type: 'object',
        properties: {
          kind: { const: 'book' },
          name: { type: 'string', title: 'Name' },
          count: { type: 'integer', layout: { break: 'before' } },
        },
      },
      initialData: { kind: 'book', name: '' },
    })
    const fields = el.querySelector('.sf-object-fields')
    expect(fields.querySelector('.sf-cell-hidden')).toBeTruthy()
    expect(fields.querySelector('.sf-cell-md input')).toBeTruthy()
    const breakEl = fields.querySelector('.sf-flow-break')
    expect(breakEl).toBeTruthy()
    expect(breakEl.nextElementSibling.classList.contains('sf-cell-xs')).toBe(true)
    app.unmount()
  })
})
