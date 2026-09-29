export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string =>
  error instanceof Error ? error.message : fallback
