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

// Build a success envelope — server/action side.
export const createApiResponseSuccess = <T = null>(data: T = null as T): ApiResponseSuccess<T> => ({
  data,
  success: true,
})

// Build the single error envelope callers branch on via `success: false`.
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
  baseURL: string // prepended to every endpoint, e.g. process.env.API_URL
  headers?: HeadersInit // sent on every request; per-call options.headers win on collision
}

// Server-only, THROW-FREE fetch factory (nextjs-conventions §26): binds a baseURL + JSON headers and returns a typed api<T>() that always resolves to an ApiResponse envelope — a non-ok status or a network/parse error becomes createApiResponseError, never a throw. The factory logs nothing — the envelope carries `success` + `message`, so the consumer decides what to log on `success: false` (with its own call-site context). The server owns error policy; a server action reads `.success` and returns the message through useActionState (§26/§38) — so no consumer writes a try/catch or an onError callback.
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
