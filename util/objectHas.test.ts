import { describe, expect, it } from 'vitest'
import { objectHas } from './objectHas'
const LOCALES = { en: 'English', pt: 'Português' }
describe('objectHas', () => {
  it('is true for an own key', () => {
    expect(objectHas(LOCALES, 'en')).toBe(true)
  })
  it('is false for a key that is not on the shape', () => {
    expect(objectHas(LOCALES, 'fr')).toBe(false)
  })
  it('rejects `__proto__`', () => {
    expect(objectHas(LOCALES, '__proto__')).toBe(false)
  })
  it('rejects an inherited key, so a prototype method is not a valid lookup', () => {
    expect('toString' in LOCALES).toBe(true)
    expect(objectHas(LOCALES, 'toString')).toBe(false)
  })
  it('narrows the key to `keyof O` for the lookup that follows', () => {
    const raw: string = 'pt'
    if (!objectHas(LOCALES, raw)) throw new Error('unreachable')
    expect(LOCALES[raw]).toBe('Português')
  })
  it('accepts a symbol or a numeric key', () => {
    const key = Symbol('id')
    expect(objectHas({ [key]: 1 }, key)).toBe(true)
    expect(objectHas({ 0: 'zero' }, 0)).toBe(true)
  })
})
