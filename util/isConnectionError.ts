// True when an error is a network/connection failure (connection refused, or a fetch that never
// reached the server) — for a retry or a "can't reach the server" fallback. Message-based, since the
// platform rarely types these; keep the auth/domain classifiers in the consumer (their strings are
// app-specific).
export const isConnectionError = (error: Error): boolean =>
  error.message.includes('ECONNREFUSED') ||
  error.message.includes('fetch failed') ||
  error.message.includes('Failed to fetch')
