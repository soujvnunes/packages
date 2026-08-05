import { describe, expect, it } from 'vitest'

import { isConnectionError } from './isConnectionError'

describe('isConnectionError', () => {
  it('matches a refused connection', () => {
    expect(isConnectionError(new Error('connect ECONNREFUSED 127.0.0.1:27017'))).toBe(true)
  })

  it("matches Node's fetch failure", () => {
    expect(isConnectionError(new TypeError('fetch failed'))).toBe(true)
  })

  it("matches the browser's fetch failure", () => {
    expect(isConnectionError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('is false for an error that reached the server', () => {
    expect(isConnectionError(new Error('Unauthorized'))).toBe(false)
    expect(isConnectionError(new Error('E11000 duplicate key'))).toBe(false)
  })

  it('takes `unknown`, so a catch binding needs no narrowing at the call site', () => {
    const caught: unknown = new Error('connect ECONNREFUSED 127.0.0.1:27017')

    expect(isConnectionError(caught)).toBe(true)
  })

  it('is false for a throw that is not an Error, which carries no message to match', () => {
    expect(isConnectionError('fetch failed')).toBe(false)
    expect(isConnectionError({ message: 'fetch failed' })).toBe(false)
    expect(isConnectionError(null)).toBe(false)
    expect(isConnectionError(undefined)).toBe(false)
  })

  it('never matches the getErrorMessage fallback text', () => {
    expect(isConnectionError(new Error('Something went wrong'))).toBe(false)
  })
})
