import { describe, expect, it } from 'vitest'
import { buildQueryString } from './buildQueryString'
describe('buildQueryString', () => {
  it('prefixes the pairs with a question mark', () => {
    expect(buildQueryString({ page: 2, sort: 'name' })).toBe('?page=2&sort=name')
  })
  it('skips null and undefined, and keeps the rest in insertion order', () => {
    expect(buildQueryString({ page: 2, cursor: null, sort: 'name', after: undefined })).toBe(
      '?page=2&sort=name',
    )
  })
  it('coerces numbers and booleans', () => {
    expect(buildQueryString({ page: 0, archived: false })).toBe('?page=0&archived=false')
  })
  it('keeps an empty string, which is a value and not an absence', () => {
    expect(buildQueryString({ q: '' })).toBe('?q=')
  })
  it('returns an empty string for an empty, undefined, or null params object', () => {
    expect(buildQueryString({})).toBe('')
    expect(buildQueryString()).toBe('')
    expect(buildQueryString(null)).toBe('')
  })
  it('returns an empty string when every value was skipped', () => {
    expect(buildQueryString({ cursor: null, after: undefined })).toBe('')
  })
  it('encodes reserved characters, so it concatenates onto a path safely', () => {
    expect(buildQueryString({ q: 'a&b=c', name: 'John Doe' })).toBe('?q=a%26b%3Dc&name=John+Doe')
  })
})
