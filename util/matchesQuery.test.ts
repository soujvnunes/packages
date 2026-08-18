import { describe, expect, it } from 'vitest'
import { matchesQuery } from './matchesQuery'
const SCHEMA = { action: ['review', 'export'], export: ['csv', 'pdf'] } as const
const FLAT = { view: ['grid', 'list'] } as const
describe('matchesQuery', () => {
  it('accepts an allowed value', () => {
    expect(matchesQuery({ view: 'grid' }, FLAT)).toBe(true)
  })
  it('accepts an absent param, so every param is optional', () => {
    expect(matchesQuery({}, FLAT)).toBe(true)
  })
  it('rejects a value outside the allow-list', () => {
    expect(matchesQuery({ view: 'table' }, FLAT)).toBe(false)
  })
  it('rejects a repeated param, which arrives as an array', () => {
    expect(matchesQuery({ view: ['grid', 'list'] }, FLAT)).toBe(false)
  })
  it('ignores a param the schema does not name', () => {
    expect(matchesQuery({ view: 'grid', utm_source: 'newsletter' }, FLAT)).toBe(true)
  })
  it('reads no inherited key, so a schema naming one sees it as absent rather than as a prototype member', () => {
    expect(matchesQuery({}, { constructor: ['a', 'b'] } as const)).toBe(true)
    expect(matchesQuery({}, { toString: ['a', 'b'] } as const)).toBe(true)
  })
  it('narrows each param to its literal union', () => {
    const query: Record<string, string | string[] | undefined> = { view: 'grid' }
    if (!matchesQuery(query, FLAT)) throw new Error('unreachable')
    const view: 'grid' | 'list' | undefined = query.view
    expect(view).toBe('grid')
  })
  describe('dependency, where a schema value names another schema key', () => {
    it('accepts the dependent param alongside the parent value that enables it', () => {
      expect(matchesQuery({ action: 'export', export: 'csv' }, SCHEMA)).toBe(true)
    })
    it('requires the dependent param once the parent holds its name', () => {
      expect(matchesQuery({ action: 'export' }, SCHEMA)).toBe(false)
    })
    it('rejects the dependent param when the parent is absent', () => {
      expect(matchesQuery({ export: 'csv' }, SCHEMA)).toBe(false)
    })
    it('rejects the dependent param when the parent holds another value', () => {
      expect(matchesQuery({ action: 'review', export: 'csv' }, SCHEMA)).toBe(false)
    })
    it('accepts a parent value that names no dependent', () => {
      expect(matchesQuery({ action: 'review' }, SCHEMA)).toBe(true)
    })
    it('accepts an empty query, since the parent is absent too', () => {
      expect(matchesQuery({}, SCHEMA)).toBe(true)
    })
    it('still checks the dependent value against its own allow-list', () => {
      expect(matchesQuery({ action: 'export', export: 'xlsx' }, SCHEMA)).toBe(false)
    })
  })
})
