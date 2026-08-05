import { describe, expect, it } from 'vitest'

import { formatTimestamp } from './formatTimestamp'

describe('formatTimestamp', () => {
  it('formats an ISO string', () => {
    expect(formatTimestamp('2026-08-05T14:30:00Z', 'en-US')).toBe('Aug 05, 2026, 14:30')
  })

  it('formats a Date the same way it formats its ISO string', () => {
    const value = new Date('2026-08-05T14:30:00Z')

    expect(formatTimestamp(value, 'en-US')).toBe(formatTimestamp(value.toISOString(), 'en-US'))
  })

  it('follows the locale', () => {
    expect(formatTimestamp('2026-08-05T14:30:00Z', 'pt-BR')).toBe('05 de ago. de 2026, 14:30')
    expect(formatTimestamp('2026-08-05T14:30:00Z', 'en-GB')).toBe('05 Aug 2026, 14:30')
  })

  it('renders midnight as 00, never as the h24 cycle 24', () => {
    expect(formatTimestamp('2026-01-09T00:05:00Z', 'en-US')).toBe('Jan 09, 2026, 00:05')
    expect(formatTimestamp('2026-01-09T00:05:00Z', 'pt-BR')).toBe('09 de jan. de 2026, 00:05')
  })

  it('uses a 24-hour clock, so no locale appends AM or PM', () => {
    expect(formatTimestamp('2026-08-05T21:45:00Z', 'en-US')).toBe('Aug 05, 2026, 21:45')
  })

  it('pads the day, hour, and minute to two digits', () => {
    expect(formatTimestamp('2026-08-05T09:05:00Z', 'en-US')).toBe('Aug 05, 2026, 09:05')
  })

  it('throws on an unparseable value, so a bad date surfaces instead of rendering as text', () => {
    expect(() => formatTimestamp('not a date', 'en-US')).toThrow(RangeError)
  })

  it('throws on an unknown locale tag', () => {
    expect(() => formatTimestamp('2026-08-05T14:30:00Z', 'not a locale')).toThrow(RangeError)
  })
})
