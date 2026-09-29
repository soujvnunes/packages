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
