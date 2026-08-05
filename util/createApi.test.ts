import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApi, createApiResponseError, createApiResponseSuccess } from './createApi'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

const ok = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) })

const requestInit = () => fetchMock.mock.calls[0]?.[1]

describe('createApiResponseSuccess', () => {
  it('wraps the data', () => {
    expect(createApiResponseSuccess({ id: '1' })).toEqual({ data: { id: '1' }, success: true })
  })

  it('defaults the data to null, for an action with nothing to return', () => {
    expect(createApiResponseSuccess()).toEqual({ data: null, success: true })
  })
})

describe('createApiResponseError', () => {
  it('defaults to a 404 not found', () => {
    expect(createApiResponseError()).toMatchObject({
      status: 404,
      message: 'Not found',
      data: undefined,
      success: false,
    })
  })

  it('stamps an ISO timestamp', () => {
    expect(createApiResponseError().timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/)
  })
})

describe('createApi', () => {
  // Bound once and reused, the way a consumer holds `export const api = createApi({ … })`.
  const api = createApi({ baseURL: 'https://api.test' })

  it('prepends the baseURL to the endpoint', async () => {
    fetchMock.mockResolvedValue(ok(createApiResponseSuccess({ id: '1' })))

    await api('/user/1')

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/user/1', expect.anything())
  })

  it('passes the success envelope through untouched', async () => {
    const envelope = createApiResponseSuccess({ id: '1' })

    fetchMock.mockResolvedValue(ok(envelope))

    await expect(api('/user/1')).resolves.toEqual(envelope)
  })

  it('sends JSON headers, and lets a per-call header win over a factory header', async () => {
    fetchMock.mockResolvedValue(ok(createApiResponseSuccess()))

    const authed = createApi({ baseURL: 'https://api.test', headers: { Authorization: 'Bearer a' } })

    await authed('/user/1', { headers: { Authorization: 'Bearer b' } })

    expect(requestInit()?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer b',
    })
  })

  it('forwards the request options', async () => {
    fetchMock.mockResolvedValue(ok(createApiResponseSuccess()))

    await api('/user', { method: 'POST', body: '{}' })

    expect(requestInit()).toMatchObject({ method: 'POST', body: '{}' })
  })

  it('turns a non-ok status into an error envelope rather than a rejection', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })

    await expect(api('/user/9')).resolves.toMatchObject({
      status: 404,
      message: 'Not Found',
      success: false,
    })
  })

  it('names the failure when the status carries no statusText', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: '' })

    await expect(api('/user/9')).resolves.toMatchObject({ status: 500, message: 'Request failed' })
  })

  it('does not read the body of a non-ok response', async () => {
    const json = vi.fn()

    fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found', json })

    await api('/user/9')

    expect(json).not.toHaveBeenCalled()
  })

  it('turns a network failure into a 500 envelope carrying the message', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(api('/user/1')).resolves.toMatchObject({
      status: 500,
      message: 'fetch failed',
      success: false,
    })
  })

  it('turns a parse failure into a 500 envelope', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    })

    await expect(api('/user/1')).resolves.toMatchObject({
      status: 500,
      message: 'Unexpected token < in JSON',
    })
  })

  it('names the failure when the throw is not an Error', async () => {
    fetchMock.mockRejectedValue('boom')

    await expect(api('/user/1')).resolves.toMatchObject({
      status: 500,
      message: 'Network request failed',
    })
  })
})
