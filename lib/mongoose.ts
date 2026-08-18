import { attachDatabasePool } from '@vercel/functions'
import { connect, type Connection, type ConnectOptions, type Mongoose, type mongo } from 'mongoose'
export interface MongooseConnectionOptions extends ConnectOptions {
  mongoDbURI: string | undefined
}
const cache = {
  conn: null as Connection | null,
  promise: null as Promise<Mongoose> | null,
  poolAttached: false,
}
declare global {
  var mongoose: typeof cache | undefined
}
/**
 * Builds a serverless-safe Mongoose connection bound to `mongoDbURI` and returns the access
 * boundaries. The connection is cached on `globalThis` so it survives lambda reuse and dev
 * hot-reload. Any Mongoose `ConnectOptions` may be passed; the four below are defaulted. Call
 * once per app (e.g. `shared/lib/mongodb.ts`) and destructure the helpers.
 */
export const createMongooseConnection = ({
  mongoDbURI,
  bufferCommands = false,
  maxPoolSize = 10, // Limit connections per lambda to prevent exhaustion
  serverSelectionTimeoutMS = 5000, // Fail fast if DB is down
  serverApi = { version: '1' as const, strict: true, deprecationErrors: true },
  ...rest
}: MongooseConnectionOptions) => {
  const cached = global.mongoose ?? (global.mongoose = cache)
  const connectDb = async () => {
    if (!mongoDbURI) throw Error('Missing database environment variable')
    if (cached.conn) return cached.conn
    cached.promise ??= connect(mongoDbURI, {
      bufferCommands,
      maxPoolSize,
      serverSelectionTimeoutMS,
      serverApi,
      ...rest,
    }).then((mongoose) => mongoose)
    try {
      const mongoose = await cached.promise
      cached.conn = mongoose.connection
      if (!cached.poolAttached && mongoose.connection.getClient()) {
        attachDatabasePool(mongoose.connection.getClient()) // Vercel Fluid Compute connection management
        cached.poolAttached = true
      }
    } catch (error) {
      cached.promise = null
      throw error
    }
    return cached.conn
  }
  // Return types are annotated so the emitted .d.ts can name the driver types without a non-portable reference into the transitive `mongodb` package.
  const getDbClient = async (): Promise<mongo.MongoClient> => {
    const conn = await connectDb()
    return conn.getClient()
  }
  const getDB = async (): Promise<mongo.Db> => {
    const client = await getDbClient()
    return client.db()
  }
  /** Connects, then runs the callback (for Server Components & standard async functions). */
  const withDb = async <T>(operation: () => Promise<T> | PromiseLike<T>): Promise<T> => {
    await connectDb()
    return operation()
  }
  /** Wraps a callback so it connects on call (for Server Actions / reusable async functions). */
  const withDbCallback =
    <Args extends unknown[], Return>(action: (...args: Args) => Promise<Return>) =>
    async (...args: Args): Promise<Return> => {
      await connectDb()
      return action(...args)
    }
  return { connectDb, getDbClient, getDB, withDb, withDbCallback }
}
