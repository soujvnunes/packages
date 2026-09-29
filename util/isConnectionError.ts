import { getErrorMessage } from './getErrorMessage'
export const isConnectionError = (error: unknown): boolean => {
  const message = getErrorMessage(error, '')
  return (
    message.includes('ECONNREFUSED') ||
    message.includes('fetch failed') ||
    message.includes('Failed to fetch')
  )
}
