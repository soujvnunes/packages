type SearchParamSchema = Record<string, readonly string[]>

// Private building block: a single-value param matches when absent (undefined) or one of the allowed literals. A repeated param arrives as string[] — rejected. Narrows to `K | undefined`.
const matchesParam = <const K extends string>(
  value: string | string[] | undefined,
  allowed: readonly K[],
): value is K | undefined =>
  value === undefined || (typeof value === 'string' && (allowed as readonly string[]).includes(value))

// Validates a whole searchParams object against a schema (each param → its allowed values), and narrows every param to its literal union.
//
// Dependency convention: a value that names another schema key marks a dependency — the named (dependent) param is valid ONLY when its parent holds that value, and is REQUIRED when it does. e.g. `{ action: ['review', 'export'], export: ['csv', 'pdf'] }`: `export` is a key that also appears as a value under `action`, so `?export` is valid only alongside `?action=export`, and `?action=export` without a valid `?export` is rejected.
export const matchesQuery = <const S extends SearchParamSchema>(
  query: Record<string, string | string[] | undefined>,
  schema: S,
): query is { [K in keyof S]?: S[K][number] } =>
  Object.entries(schema).every(([key, allowed]) => {
    if (!matchesParam(query[key], allowed)) return false

    // Present iff the parent (the key whose allowed values name this one) holds it.
    const parent = Object.entries(schema).find(([p, vals]) => p !== key && vals.includes(key))?.[0]

    return !parent || (query[key] !== undefined) === (query[parent] === key)
  })
