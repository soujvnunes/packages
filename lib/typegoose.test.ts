import { buildSchema, prop } from '@typegoose/typegoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { describe, expect, it } from 'vitest'

import { BaseModel, BaseTimestampedModel } from './typegoose'

// Types are explicit because the test runner's transform emits no decorator metadata for `@prop()` to infer from.
class Address extends BaseModel {
  @prop({ type: () => String })
  public street?: string
}

class Entry extends BaseTimestampedModel {
  @prop({ type: () => String })
  public title?: string
}

// `plugins` is on the Schema at runtime but absent from mongoose's public types.
const hasLeanVirtuals = (schema: ReturnType<typeof buildSchema>) =>
  (schema as unknown as { plugins: { fn: unknown }[] }).plugins.some(
    (entry) => entry.fn === mongooseLeanVirtuals,
  )

describe('BaseModel', () => {
  it('turns on virtuals for both serializers, so a lean read can attach `id`', () => {
    const schema = buildSchema(Address)

    expect(schema.options.toJSON).toMatchObject({ virtuals: true })
    expect(schema.options.toObject).toMatchObject({ virtuals: true })
  })

  it('registers the lean-virtuals plugin', () => {
    expect(hasLeanVirtuals(buildSchema(Address))).toBe(true)
  })

  it('carries no timestamps, since a subdocument is stamped by its parent', () => {
    expect(buildSchema(Address).options.timestamps).toBeFalsy()
  })
})

describe('BaseTimestampedModel', () => {
  it('turns on virtuals for both serializers', () => {
    const schema = buildSchema(Entry)

    expect(schema.options.toJSON).toMatchObject({ virtuals: true })
    expect(schema.options.toObject).toMatchObject({ virtuals: true })
  })

  it('registers the lean-virtuals plugin', () => {
    expect(hasLeanVirtuals(buildSchema(Entry))).toBe(true)
  })

  it('turns on timestamps, which is what separates it from BaseModel', () => {
    expect(buildSchema(Entry).options.timestamps).toBe(true)
  })

  it('inherits the createdAt and updatedAt paths from TimeStamps', () => {
    const schema = buildSchema(Entry)

    expect(schema.path('createdAt')).toBeDefined()
    expect(schema.path('updatedAt')).toBeDefined()
  })

  it('keeps a subclass field alongside the inherited ones', () => {
    expect(buildSchema(Entry).path('title')).toBeDefined()
  })
})
