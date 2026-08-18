// Serialize a flat params object into a query string: a leading `?` plus the pairs, or '' when the object is empty/nullish. Skips undefined/null values; coerces the rest with String().
export const buildQueryString = (
  params?: Record<string, string | number | boolean | null | undefined> | null,
): string => {
  if (!params) return ''
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) queryParams.append(key, String(value))
  })
  const query = queryParams.toString()
  return query ? `?${query}` : ''
}
