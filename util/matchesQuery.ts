type SearchParamSchema = Record<string, readonly string[]>
const matchesParam = <const K extends string>(
  value: string | string[] | undefined,
  allowed: readonly K[],
): value is K | undefined =>
  value === undefined || (typeof value === 'string' && (allowed as readonly string[]).includes(value))
export const matchesQuery = <const S extends SearchParamSchema>(
  query: Record<string, string | string[] | undefined>,
  schema: S,
): query is { [K in keyof S]?: S[K][number] } => {
  const params = new Map(Object.entries(query))
  return Object.entries(schema).every(([key, allowed]) => {
    if (!matchesParam(params.get(key), allowed)) return false
    const parent = Object.entries(schema).find(([p, vals]) => p !== key && vals.includes(key))?.[0]
    return !parent || (params.get(key) !== undefined) === (params.get(parent) === key)
  })
}
