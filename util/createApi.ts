import { getErrorMessage } from './getErrorMessage'
export interface ApiResponseSuccess<T> {
  data: T
  success: true
}
export interface ApiResponseError {
  status: number
  message: string
  data: undefined
  success: false
  timestamp: string
}
export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError
export const createApiResponseSuccess = <T = null>(data: T = null as T): ApiResponseSuccess<T> => ({
  data,
  success: true,
})
export const createApiResponseError = ({
  message = 'Not found',
  status = 404,
}: Partial<Pick<ApiResponseError, 'message' | 'status'>> = {}): ApiResponseError => ({
  status,
  message,
  data: undefined,
  success: false,
  timestamp: new Date().toISOString(),
})
export interface CreateApiOptions {
  baseURL: string
  headers?: HeadersInit
}
export const createApi =
  ({ baseURL, headers }: CreateApiOptions) =>
  async <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...headers, ...options?.headers },
      })
      if (!response.ok) {
        return createApiResponseError({
          status: response.status,
          message: response.statusText || 'Request failed',
        })
      }
      return (await response.json()) as ApiResponse<T>
    } catch (error) {
      return createApiResponseError({
        status: 500,
        message: getErrorMessage(error, 'Network request failed'),
      })
    }
  }
