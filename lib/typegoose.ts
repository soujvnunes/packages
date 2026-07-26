import 'reflect-metadata'

import { plugin, modelOptions } from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses.js'
import type { Types } from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'

/**
 * Base class for subdocuments. Provides strict typing for Mongoose ObjectIds and string
 * virtuals. Replaces Typegoose's `Base` interface to avoid ESLint merging errors.
 */
@plugin(mongooseLeanVirtuals)
@modelOptions({ schemaOptions: { toJSON: { virtuals: true }, toObject: { virtuals: true } } })
export abstract class BaseModel {
  public _id!: Types.ObjectId
  public id!: string
}

/**
 * Base class for main documents. Combines standard Mongoose IDs with Typegoose's Timestamp
 * definitions.
 */
@plugin(mongooseLeanVirtuals)
@modelOptions({
  schemaOptions: { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
})
export abstract class BaseTimestampedModel extends TimeStamps {
  public _id!: Types.ObjectId
  public id!: string
}
