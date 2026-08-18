import { getErrorMessage } from './getErrorMessage'
// Message-based because the platform rarely types a connection failure; keep the auth and domain classifiers in the consumer, where their app-specific strings live.
export const isConnectionError = (error: unknown): boolean => {
  // Empty fallback: a non-Error throw has no message to match, so it is never a connection failure.
  const message = getErrorMessage(error, '')
  return (
    message.includes('ECONNREFUSED') ||
    message.includes('fetch failed') ||
    message.includes('Failed to fetch')
  )
}
