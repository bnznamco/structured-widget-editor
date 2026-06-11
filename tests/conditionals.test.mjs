import { describe, it, expect } from 'vitest'
import { applyConditionals, matchesSchema, hasConditionals } from '../src/conditionals.js'

describe('matchesSchema', () => {
  it('matches const and enum property constraints', () => {
    const schema = { properties: { status: { const: 'published' } } }
    expect(matchesSchema({ status: 'published' }, schema)).toBe(true)
    expect(matchesSchema({ status: 'draft' }, schema)).toBe(false)
    const enumSchema = { properties: { kind: { enum: ['a', 'b'] } } }
    expect(matchesSchema({ kind: 'b' }, enumSchema)).toBe(true)
    expect(matchesSchema({ kind: 'c' }, enumSchema)).toBe(false)
  })

  it('treats empty string and null as absent for required (form semantics)', () => {
    const schema = { required: ['status'] }
    expect(matchesSchema({ status: 'x' }, schema)).toBe(true)
    expect(matchesSchema({ status: '' }, schema)).toBe(false)
    expect(matchesSchema({ status: null }, schema)).toBe(false)
    expect(matchesSchema({}, schema)).toBe(false)
  })

  it('ignores property constraints for absent keys', () => {
    const schema = { properties: { n: { minimum: 5 } } }
    expect(matchesSchema({}, schema)).toBe(true)
    expect(matchesSchema({ n: 3 }, schema)).toBe(false)
    expect(matchesSchema({ n: 7 }, schema)).toBe(true)
  })

  it('supports not / allOf / oneOf combinators', () => {
    expect(matchesSchema({ a: 1 }, { not: { properties: { a: { const: 1 } }, required: ['a'] } })).toBe(false)
    expect(
      matchesSchema(
        { a: 1, b: 2 },
        { allOf: [{ properties: { a: { const: 1 } } }, { properties: { b: { const: 2 } } }] }
      )
    ).toBe(true)
    // oneOf must match exactly one branch
    expect(
      matchesSchema({ a: 1 }, { oneOf: [{ properties: { a: { const: 1 } } }, { properties: { a: { const: 2 } } }] })
    ).toBe(true)
    expect(
      matchesSchema({ a: 1 }, { oneOf: [{ properties: { a: { const: 1 } } }, { properties: { a: { minimum: 0 } } }] })
    ).toBe(false)
  })
})

describe('hasConditionals', () => {
  it('detects top-level and allOf conditionals', () => {
    expect(hasConditionals({ if: {}, then: {} })).toBe(true)
    expect(hasConditionals({ dependentSchemas: {} })).toBe(true)
    expect(hasConditionals({ allOf: [{ if: {}, then: {} }] })).toBe(true)
    expect(hasConditionals({ properties: {} })).toBe(false)
  })
})

describe('applyConditionals', () => {
  const base = {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['draft', 'archived'] },
      title: { type: 'string' },
    },
    required: ['status'],
    allOf: [
      {
        if: { properties: { status: { const: 'archived' } }, required: ['status'] },
        then: {
          properties: { archive_reason: { type: 'string' } },
          required: ['archive_reason'],
        },
      },
    ],
  }

  it('merges a matching then-branch into the effective schema', () => {
    const effective = applyConditionals(base, { status: 'archived' })
    expect(Object.keys(effective.properties)).toContain('archive_reason')
    expect(effective.required).toContain('archive_reason')
  })

  it('leaves the schema unchanged when the if does not match', () => {
    const effective = applyConditionals(base, { status: 'draft' })
    expect(Object.keys(effective.properties)).not.toContain('archive_reason')
    expect(effective.required).not.toContain('archive_reason')
  })

  it('places controlled properties right after the controlling field', () => {
    const effective = applyConditionals(base, { status: 'archived' })
    const keys = Object.keys(effective.properties)
    expect(keys.indexOf('archive_reason')).toBe(keys.indexOf('status') + 1)
  })

  it('applies else-branches when the if does not match', () => {
    const schema = {
      type: 'object',
      properties: { mode: { type: 'string' } },
      if: { properties: { mode: { const: 'a' } }, required: ['mode'] },
      then: { properties: { a_only: { type: 'string' } } },
      else: { properties: { b_only: { type: 'string' } } },
    }
    expect(Object.keys(applyConditionals(schema, { mode: 'a' }).properties)).toContain('a_only')
    expect(Object.keys(applyConditionals(schema, { mode: 'b' }).properties)).toContain('b_only')
  })

  it('fires dependentSchemas when the key is present', () => {
    const schema = {
      type: 'object',
      properties: { publisher: { type: 'string' } },
      dependentSchemas: {
        publisher: { properties: { edition: { type: 'string' } } },
      },
    }
    expect(Object.keys(applyConditionals(schema, { publisher: 'X' }).properties)).toContain('edition')
    expect(Object.keys(applyConditionals(schema, {}).properties)).not.toContain('edition')
  })

  it('unions dependentRequired into required', () => {
    const schema = {
      type: 'object',
      properties: { card: { type: 'string' }, cvv: { type: 'string' } },
      dependentRequired: { card: ['cvv'] },
    }
    expect(applyConditionals(schema, { card: '1234' }).required).toContain('cvv')
  })

  it('is a no-op for non-object schemas and schemas without conditionals', () => {
    const plain = { type: 'string' }
    expect(applyConditionals(plain, 'x')).toEqual(plain)
    const noCond = { type: 'object', properties: { a: { type: 'string' } } }
    // object schemas get `required` normalized to an array; nothing else changes
    expect(applyConditionals(noCond, {})).toEqual({ ...noCond, required: [] })
  })
})
