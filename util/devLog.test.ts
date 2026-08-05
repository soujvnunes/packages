import { afterEach, describe, expect, it, vi } from 'vitest'

import { devLog } from './devLog'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('devLog', () => {
  it('prints the scope tag ahead of the arguments in development', () => {
    vi.stubEnv('NODE_ENV', 'development')

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    devLog('extraction', 'page', 3, 'of', 12)

    expect(log).toHaveBeenCalledWith('[extraction]', 'page', 3, 'of', 12)
  })

  it('is a no-op in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    devLog('extraction', 'anything')

    expect(log).not.toHaveBeenCalled()
  })

  it('is a no-op under test, so a suite stays quiet', () => {
    vi.stubEnv('NODE_ENV', 'test')

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    devLog('extraction', 'anything')

    expect(log).not.toHaveBeenCalled()
  })

  it('prints the tag alone when there are no arguments', () => {
    vi.stubEnv('NODE_ENV', 'development')

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    devLog('boot')

    expect(log).toHaveBeenCalledWith('[boot]')
  })
})
