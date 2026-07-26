# @soujvnunes/lib

Framework-agnostic **stateful** modules (the `shared/lib` counterpart to the pure `@soujvnunes/utils`). Each subpath's dependencies are **optional peers** — install only what the subpath you import needs.

## `./mongoose` — serverless Mongoose client factory

`createMongooseConnection({ mongoDbURI, ...connectOptions })` returns the access boundaries bound to that URI — cached on `globalThis` (survives lambda reuse + dev hot-reload) and attached to Vercel Fluid Compute. Any Mongoose `ConnectOptions` may be overridden.

```bash
pnpm add @soujvnunes/lib mongoose @vercel/functions
```

```ts
// shared/lib/mongodb.ts — call once, destructure the helpers
import { createMongooseConnection } from '@soujvnunes/lib/mongoose'

export const { connectDb, getDbClient, getDB, withDb, withDbCallback } = createMongooseConnection({
  mongoDbURI: process.env.MONGODB_URI,
  serverSelectionTimeoutMS: 2500, // optional override
})

// then, anywhere
export const getEntry = (key: string) => withDb(() => EntryModel.findOne({ key }).lean())
```

## `./typegoose` — base model classes

`BaseModel` (subdocuments) and `BaseTimestampedModel` (main docs) — both wire the `mongoose-lean-virtuals` plugin and `virtuals: true`, so `.lean({ virtuals: true })` attaches the `id` string.

```bash
pnpm add @soujvnunes/lib @typegoose/typegoose mongoose mongoose-lean-virtuals reflect-metadata
```

```ts
import { BaseTimestampedModel } from '@soujvnunes/lib/typegoose'

export class Entry extends BaseTimestampedModel {
  public id!: string
  // @prop() fields…
}
```

Requires `experimentalDecorators` in the consumer's `tsconfig.json`.
