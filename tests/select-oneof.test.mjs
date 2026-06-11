import { describe, it, expect } from 'vitest'
import { createApp, h } from 'vue'
import SchemaForm from '../src/SchemaForm.vue'
import { isChoiceOneOf } from '../src/utils.js'

function mountForm(props) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const changes = []
  const app = createApp({
    render: () => h(SchemaForm, { ...props, onChange: (v) => changes.push(v) }),
  })
  app.mount(el)
  return { el, changes, app }
}

const CHOICES = [
  { const: 'red', title: 'Red' },
  { const: 'blue', title: 'Blue' },
]

describe('isChoiceOneOf', () => {
  it('detects const/title option lists and rejects sub-schema unions', () => {
    expect(isChoiceOneOf(CHOICES)).toBe(true)
    expect(isChoiceOneOf([{ const: 1 }, { const: 2 }])).toBe(true)
    expect(isChoiceOneOf([{ type: 'string' }, { type: 'integer' }])).toBe(false)
    expect(isChoiceOneOf([{ properties: { a: {} }, const: 'x' }])).toBe(false)
    expect(isChoiceOneOf([])).toBe(false)
    expect(isChoiceOneOf(undefined)).toBe(false)
  })
})

describe('choice-list oneOf rendering (metaobjects select kind)', () => {
  const requiredSelectSchema = {
    type: 'object',
    properties: {
      color: { type: 'string', title: 'Color', oneOf: CHOICES },
    },
    required: ['color'],
  }

  it('renders a visible select with labeled options', () => {
    const { el } = mountForm({
      schema: requiredSelectSchema,
      initialData: { color: 'blue' },
    })
    const select = el.querySelector('select')
    expect(select).not.toBeNull()
    const labels = [...el.querySelectorAll('option')].map((o) => o.textContent.trim())
    expect(labels).toContain('Red')
    expect(labels).toContain('Blue')
  })

  it('does NOT overwrite the stored value on mount (HiddenEditor regression)', () => {
    // Previously this collapsed to {const:'red'} -> HiddenEditor, which
    // force-emitted 'red' over the stored 'blue' as soon as the form mounted.
    const { changes } = mountForm({
      schema: requiredSelectSchema,
      initialData: { color: 'blue' },
    })
    expect(changes).toEqual([])
  })

  it('shows the stored value as selected and emits the chosen const on change', () => {
    const { el, changes } = mountForm({
      schema: requiredSelectSchema,
      initialData: { color: 'blue' },
    })
    const select = el.querySelector('select')
    const selected = select.options[select.selectedIndex]
    expect(selected.textContent.trim()).toBe('Blue')

    select.value = '0' // options are indexed; 0 = Red
    select.dispatchEvent(new Event('change'))
    expect(changes.length).toBe(1)
    expect(changes[0]).toEqual({ color: 'red' })
  })

  it('keeps choices for OPTIONAL selects (oneOf sibling of anyOf)', () => {
    // Exact shape pydantic emits for Optional select fields: the
    // json_schema_extra oneOf sits NEXT TO the anyOf null union.
    const optionalSelectSchema = {
      type: 'object',
      properties: {
        color: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
          default: null,
          title: 'Color',
          oneOf: CHOICES,
        },
      },
    }
    const { el, changes } = mountForm({
      schema: optionalSelectSchema,
      initialData: { color: null },
    })
    const select = el.querySelector('select')
    expect(select).not.toBeNull()
    const labels = [...el.querySelectorAll('option')].map((o) => o.textContent.trim())
    expect(labels).toContain('Red')
    expect(labels).toContain('Blue')
    expect(changes).toEqual([]) // null value untouched on mount

    select.value = '1'
    select.dispatchEvent(new Event('change'))
    expect(changes[0]).toEqual({ color: 'blue' })
  })
})

describe('enum selects emit native types', () => {
  it('emits a number for integer enums instead of a string', () => {
    const schema = {
      type: 'object',
      properties: { qty: { type: 'integer', enum: [1, 2, 3] } },
    }
    const { el, changes } = mountForm({ schema, initialData: { qty: 2 } })
    const select = el.querySelector('select')
    expect(select).not.toBeNull()

    select.value = '2' // index 2 -> value 3
    select.dispatchEvent(new Event('change'))
    expect(changes[0]).toEqual({ qty: 3 })
    expect(typeof changes[0].qty).toBe('number')
  })
})
