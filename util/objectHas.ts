// Narrows an untrusted runtime string (a route param, a form field name, a search param) to a key of
// a typed object. The own-key check does both jobs at once: the compiler gets `keyof O` without an
// assertion, and a key that isn't on the shape — including `__proto__` — is rejected.
export const objectHas = <O extends Record<PropertyKey, unknown>>(
  object: O,
  key: PropertyKey,
): key is keyof O => Object.hasOwn(object, key)
