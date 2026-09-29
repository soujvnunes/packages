export const objectHas = <O extends Record<PropertyKey, unknown>>(
  object: O,
  key: PropertyKey,
): key is keyof O => Object.hasOwn(object, key)
