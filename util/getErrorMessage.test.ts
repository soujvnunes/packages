import { describe, expect, it } from 'vitest'

import { getErrorMessage } from './getErrorMessage'

describe('getErrorMessage', () => {
  it('reads the message off an Error', () => {
    expect(getErrorMessage(new Error('Boom.'))).toBe('Boom.')
  })

  it('reads the message off an Error subclass', () => {
    expect(getErrorMessage(new TypeError('fetch failed'))).toBe('fetch failed')
  })

  it('falls back for a value that is not an Error', () => {
    expect(getErrorMessage('Boom.')).toBe('Something went wrong')
    expect(getErrorMessage({ message: 'Boom.' })).toBe('Something went wrong')
    expect(getErrorMessage(null)).toBe('Something went wrong')
    expect(getErrorMessage(undefined)).toBe('Something went wrong')
  })

  it('uses the fallback passed in', () => {
    expect(getErrorMessage(null, 'Could not save the entry.')).toBe('Could not save the entry.')
  })

  it("returns an Error's empty message rather than the fallback", () => {
    expect(getErrorMessage(new Error(''), 'unused')).toBe('')
  })
})
