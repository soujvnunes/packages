import { attachDatabasePool } from '@vercel/functions'
import { connect } from 'mongoose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMongooseConnection } from './mongoose'

vi.mock('mongoose', () => ({ connect: vi.fn() }))
vi.mock('@vercel/functions', () => ({ attachDatabasePool: vi.fn() }))

const connectMock = vi.mocked(connect)
const attachMock = vi.mocked(attachDatabasePool)

const URI = 'mongodb://localhost:27017/test'

const client = { db: vi.fn(() => ({ name: 'test' })) }
const connection = { getClient: () => client }

const connectOptions = () => connectMock.mock.calls[0]?.[1]

beforeEach(() => {
  // The factory caches on globalThis to survive lambda reuse, so each test needs a fresh cache.
  global.mongoose = { conn: null, promise: null, poolAttached: false }
  connectMock.mockResolvedValue({ connection } as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('connectDb', () => {
  it('throws when the URI environment variable is missing', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: undefined })

    await expect(connectDb()).rejects.toThrow('Missing database environment variable')
    expect(connectMock).not.toHaveBeenCalled()
  })

  it('returns the connection', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI })

    await expect(connectDb()).resolves.toBe(connection)
  })

  it('connects once and reuses the cached connection', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI })

    await connectDb()
    await connectDb()
    await connectDb()

    expect(connectMock).toHaveBeenCalledOnce()
  })

  it('shares one in-flight connect between concurrent callers', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI })

    await Promise.all([connectDb(), connectDb(), connectDb()])

    expect(connectMock).toHaveBeenCalledOnce()
  })

  it('applies the serverless defaults', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI })

    await connectDb()

    expect(connectMock).toHaveBeenCalledWith(URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      serverApi: { version: '1', strict: true, deprecationErrors: true },
    })
  })

  it('takes an override for a default', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI, serverSelectionTimeoutMS: 2500 })

    await connectDb()

    expect(connectOptions()).toMatchObject({ serverSelectionTimeoutMS: 2500 })
  })

  it('forwards any other Mongoose ConnectOptions', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI, dbName: 'analytics' })

    await connectDb()

    expect(connectOptions()).toMatchObject({ dbName: 'analytics' })
  })

  it('attaches the Vercel pool once, not on every call', async () => {
    const { connectDb } = createMongooseConnection({ mongoDbURI: URI })

    await connectDb()
    await connectDb()

    expect(attachMock).toHaveBeenCalledOnce()
    expect(attachMock).toHaveBeenCalledWith(client)
  })

  it('clears the cached promise on failure, so the next call retries instead of replaying it', async () => {
    connectMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))

    const { connectDb } = createMongooseConnection({ mongoDbURI: URI })

    await expect(connectDb()).rejects.toThrow('connect ECONNREFUSED')

    await expect(connectDb()).resolves.toBe(connection)
    expect(connectMock).toHaveBeenCalledTimes(2)
  })
})

describe('getDbClient and getDB', () => {
  it('returns the driver client', async () => {
    const { getDbClient } = createMongooseConnection({ mongoDbURI: URI })

    await expect(getDbClient()).resolves.toBe(client)
  })

  it('returns the default database off that client', async () => {
    const { getDB } = createMongooseConnection({ mongoDbURI: URI })

    await expect(getDB()).resolves.toEqual({ name: 'test' })
    expect(client.db).toHaveBeenCalledWith()
  })
})

describe('withDb', () => {
  it('connects before running the operation, and returns its value', async () => {
    const { withDb } = createMongooseConnection({ mongoDbURI: URI })
    const operation = vi.fn(() => Promise.resolve('entry'))

    await expect(withDb(operation)).resolves.toBe('entry')
    expect(connectMock).toHaveBeenCalledOnce()
    expect(operation).toHaveBeenCalledOnce()
  })

  it('never runs the operation when the connection fails', async () => {
    connectMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))

    const { withDb } = createMongooseConnection({ mongoDbURI: URI })
    const operation = vi.fn(() => Promise.resolve('entry'))

    await expect(withDb(operation)).rejects.toThrow('connect ECONNREFUSED')
    expect(operation).not.toHaveBeenCalled()
  })
})

describe('withDbCallback', () => {
  it('does not connect until the wrapped function is called', async () => {
    const { withDbCallback } = createMongooseConnection({ mongoDbURI: URI })
    const action = withDbCallback((id: string) => Promise.resolve(`entry-${id}`))

    expect(connectMock).not.toHaveBeenCalled()

    await expect(action('1')).resolves.toBe('entry-1')
    expect(connectMock).toHaveBeenCalledOnce()
  })

  it('forwards every argument to the wrapped function', async () => {
    const { withDbCallback } = createMongooseConnection({ mongoDbURI: URI })
    const inner = vi.fn((a: string, b: number) => Promise.resolve(`${a}${b}`))

    await expect(withDbCallback(inner)('x', 2)).resolves.toBe('x2')
    expect(inner).toHaveBeenCalledWith('x', 2)
  })
})
