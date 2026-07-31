// Extract a human-readable message from an unknown thrown value — an Error's `message`, else the
// fallback. Use at a boundary that must not rethrow (the throw-free createApi, a server action).
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string =>
  error instanceof Error ? error.message : fallback
