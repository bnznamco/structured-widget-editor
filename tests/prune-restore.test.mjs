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

// Regression C54: toggling a conditional controller away and back used to
// permanently destroy what the user typed into the controlled fields.

const SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['draft', 'archived'] },
  },
  required: ['status'],
  allOf: [
    {
      if: { properties: { status: { const: 'archived' } }, required: ['status'] },
      then: { properties: { archive_reason: { type: 'string' } } },
    },
  ],
}

function setSelect(el, optionLabel) {
  const select = el.querySelector('select')
  const idx = [...select.options].findIndex((o) => o.textContent.trim() === optionLabel)
  select.value = select.options[idx].value
  select.dispatchEvent(new Event('change'))
}

describe('pruneInactive stash/restore', () => {
  it('prunes deactivated conditional values from the emitted data (documented)', async () => {
    const { el, changes } = mountForm({
      schema: SCHEMA,
      initialData: { status: 'archived', archive_reason: 'old stuff' },
    })
    setSelect(el, 'draft')
    const last = changes[changes.length - 1]
    expect(last.status).toBe('draft')
    expect('archive_reason' in last).toBe(false)
  })

  it('restores the typed value when the controller toggles back', async () => {
    const { el, changes } = mountForm({
      schema: SCHEMA,
      initialData: { status: 'archived', archive_reason: 'old stuff' },
    })
    setSelect(el, 'draft')
    expect('archive_reason' in changes[changes.length - 1]).toBe(false)

    // wait for the re-render so the select reflects the new value
    await new Promise((r) => setTimeout(r, 0))
    setSelect(el, 'archived')
    const last = changes[changes.length - 1]
    expect(last.status).toBe('archived')
    expect(last.archive_reason).toBe('old stuff')
  })
})
