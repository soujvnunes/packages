export interface CreateApiOptions<ErrorResult> {
  // Prepended to every endpoint, e.g. `process.env.API_URL`.
  baseURL: string
  // Sent on every request; per-call `options.headers` win on key collision.
  headers?: HeadersInit
  // Maps a thrown fetch/parse error to the caller's own error envelope — the one piece of the
  // response shape the package can't own, so the consumer supplies it (never inline an envelope).
  onError: (error: unknown) => ErrorResult
}

// Fetch helper factory: binds a baseURL + default JSON headers + an error mapper, then returns a
// typed `api<T>(endpoint, options)`. A network/parse failure resolves to `onError(error)` instead
// of rejecting, so callers branch on the value, never a try/catch.
export const createApi =
  <ErrorResult>({ baseURL, headers, onError }: CreateApiOptions<ErrorResult>) =>
  async <T>(endpoint: string, options?: RequestInit): Promise<T | ErrorResult> => {
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options?.headers,
        },
      })

      return (await response.json()) as T
    } catch (error) {
      return onError(error)
    }
  }
