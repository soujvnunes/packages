# @soujvnunes/lib

Framework-agnostic **stateful** modules (the `shared/lib` counterpart to the pure `@soujvnunes/util`). Each subpath's dependencies are **optional peers**, so install only what the subpath you import needs.

## `./mongoose`: serverless Mongoose client factory

`createMongooseConnection({ mongoDbURI, ...connectOptions })` returns the access boundaries bound to that URI, cached on `globalThis` (survives lambda reuse and dev hot-reload) and attached to Vercel Fluid Compute. Any Mongoose `ConnectOptions` may be overridden; four are defaulted: `bufferCommands: false`, `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000` and `serverApi: { version: '1', strict: true, deprecationErrors: true }`.

- `withDb(operation)` connects, then runs the operation: the shape for a Server Component or any one-off async function.
- `withDbCallback(action)` returns a function that connects on each call before running the action: the shape for a Server Action or a reusable async function.

```bash
pnpm add @soujvnunes/lib mongoose @vercel/functions
```

```ts
// shared/lib/mongodb.ts, call once, destructure the helpers
import { createMongooseConnection } from '@soujvnunes/lib/mongoose'

export const { connectDb, getDbClient, getDB, withDb, withDbCallback } = createMongooseConnection({
  mongoDbURI: process.env.MONGODB_URI,
  serverSelectionTimeoutMS: 2500, // optional override
})

// then, anywhere
export const getEntry = (key: string) => withDb(() => EntryModel.findOne({ key }).lean())
```

## `./typegoose`: base model classes

`BaseModel` (subdocuments) and `BaseTimestampedModel` (main docs) both wire the `mongoose-lean-virtuals` plugin and `virtuals: true`, so `.lean({ virtuals: true })` attaches the `id` string. Both type `_id` as a Mongoose `ObjectId` and `id` as a string. `BaseTimestampedModel` also extends Typegoose's `TimeStamps` and turns on `timestamps`, so `createdAt` and `updatedAt` are set and typed.

They stand in for Typegoose's `Base` interface, whose documented use merges an interface into the model class of the same name, a merge ESLint reports.

```bash
pnpm add @soujvnunes/lib @typegoose/typegoose mongoose mongoose-lean-virtuals reflect-metadata
```

```ts
import { BaseTimestampedModel } from '@soujvnunes/lib/typegoose'

export class Entry extends BaseTimestampedModel {
  public id!: string
  // @prop() fields...
}
```

Requires `experimentalDecorators` in the consumer's `tsconfig.json`, plus `emitDecoratorMetadata` if you want a bare `@prop()` to infer its type. Without the metadata, Typegoose rejects the field with `Type is: "undefined" [E009]`, so give each prop an explicit type instead: `@prop({ type: () => String })`.
