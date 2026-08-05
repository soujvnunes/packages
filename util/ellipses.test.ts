import { describe, expect, it } from 'vitest'

import { ellipses } from './ellipses'

describe('ellipses', () => {
  it('keeps three characters from each end by default', () => {
    expect(ellipses('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe('0x7...76F')
  })

  it('keeps `count` characters from each end', () => {
    expect(ellipses('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 6)).toBe('0x71C7...d8976F')
  })

  it('throws below the length where truncating would save characters', () => {
    expect(() => ellipses('abcdefgh')).toThrow('Unnecessary usage of ellipses utility.')
    expect(() => ellipses('abcdefghijk', 5)).toThrow('Unnecessary usage of ellipses utility.')
  })

  it('accepts the boundary length, where output and input are the same size', () => {
    expect(ellipses('abcdefghi')).toBe('abc...ghi')
  })

  it('reads both ends of the source, never a re-slice of the head', () => {
    expect(ellipses('abcdefghijk', 4)).toBe('abcd...hijk')
  })
})
