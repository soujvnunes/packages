import { attachDatabasePool } from '@vercel/functions'
import { connect, type Connection, type ConnectOptions, type Mongoose, type mongo } from 'mongoose'
export interface MongooseConnectionOptions extends ConnectOptions {
  mongoDbURI: string | undefined
}
export interface MongooseConnection {
  connectDb: () => Promise<Connection>
  getDbClient: () => Promise<mongo.MongoClient>
  getDB: () => Promise<mongo.Db>
  withDb: <T>(operation: () => Promise<T> | PromiseLike<T>) => Promise<T>
  withDbCallback: <Args extends unknown[], Return>(
    action: (...args: Args) => Promise<Return>,
  ) => (...args: Args) => Promise<Return>
}
const cache = {
  conn: null as Connection | null,
  promise: null as Promise<Mongoose> | null,
  poolAttached: false,
}
declare global {
  var mongoose: typeof cache | undefined
}
export const createMongooseConnection = ({
  mongoDbURI,
  bufferCommands = false,
  maxPoolSize = 10,
  serverSelectionTimeoutMS = 5000,
  serverApi = { version: '1' as const, strict: true, deprecationErrors: true },
  ...rest
}: MongooseConnectionOptions): MongooseConnection => {
  const cached = global.mongoose ?? (global.mongoose = cache)
  const connectDb: MongooseConnection['connectDb'] = async () => {
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
        attachDatabasePool(mongoose.connection.getClient())
        cached.poolAttached = true
      }
    } catch (error) {
      cached.promise = null
      throw error
    }
    return cached.conn
  }
  const getDbClient: MongooseConnection['getDbClient'] = async () => {
    const conn = await connectDb()
    return conn.getClient()
  }
  const getDB: MongooseConnection['getDB'] = async () => {
    const client = await getDbClient()
    return client.db()
  }
  const withDb: MongooseConnection['withDb'] = async (operation) => {
    await connectDb()
    return operation()
  }
  const withDbCallback: MongooseConnection['withDbCallback'] =
    (action) =>
    async (...args) => {
      await connectDb()
      return action(...args)
    }
  return { connectDb, getDbClient, getDB, withDb, withDbCallback }
}
