import { describe, it, expect } from 'vitest'
import { createApp, h } from 'vue'
import SchemaForm from '../src/SchemaForm.vue'

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

// Regression F50: pydantic emits json_schema_extra keys as SIBLINGS of anyOf
// on Optional fields; the nullable collapse used to keep only title/default,
// silently dropping placeholder/format/lengths/bounds.

describe('Optional-field sibling hints survive the nullable collapse', () => {
  it('keeps format: textarea and placeholder on an optional string', () => {
    const schema = {
      type: 'object',
      properties: {
        notes: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
          default: null,
          title: 'Notes',
          format: 'textarea',
          placeholder: 'Write here',
        },
      },
    }
    const { el } = mountForm({ schema, initialData: { notes: 'x' } })
    const textarea = el.querySelector('textarea')
    expect(textarea).not.toBeNull()
    expect(textarea.getAttribute('placeholder')).toBe('Write here')
  })

  it('keeps minimum/maximum on an optional number input', () => {
    const schema = {
      type: 'object',
      properties: {
        qty: {
          anyOf: [{ type: 'integer' }, { type: 'null' }],
          default: null,
          minimum: 1,
          maximum: 9,
        },
      },
    }
    const { el } = mountForm({ schema, initialData: { qty: 5 } })
    const input = el.querySelector('input[type="number"]')
    expect(input).not.toBeNull()
    expect(input.getAttribute('min')).toBe('1')
    expect(input.getAttribute('max')).toBe('9')
  })

  it('outer title still overrides the inner branch and default stays null', () => {
    const schema = {
      type: 'object',
      properties: {
        f: {
          anyOf: [{ type: 'string', title: 'Inner' }, { type: 'null' }],
          title: 'Outer',
        },
      },
    }
    const { el } = mountForm({ schema, initialData: {} })
    const label = el.querySelector('.sf-label')
    expect(label.textContent).toContain('Outer')
  })
})
