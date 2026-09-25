'use client'
import { Component } from 'react'
interface FallbackError extends Error {
  digest?: string
}
export interface ErrorBoundaryFallbackProps {
  error: FallbackError
  reset: () => void
}
interface ErrorBoundaryProps {
  children: React.ReactNode
  Fallback: React.ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}
// The toString check also accepts an Error from another realm (an iframe, `node:vm`), which `instanceof` misses.
const isError = (value: unknown): value is Error =>
  value instanceof Error || Object.prototype.toString.call(value) === '[object Error]'
// Never throws, since it runs inside getDerivedStateFromError: a null-prototype object or a throwing toString would otherwise escape the boundary.
const messageOf = (value: unknown): string => {
  try {
    if (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof value.message === 'string'
    )
      return value.message
    return String(value)
  } catch {
    return 'A non-Error value was thrown'
  }
}
// A thrown non-Error (`throw null`, a string, an API error object) becomes an Error carrying the original on `cause`, so a falsy one still shows the Fallback and every reader gets the type it declares.
const toError = (value: unknown): Error =>
  isError(value) ? value : new Error(messageOf(value), { cause: value })
// redirect(), notFound(), forbidden() and unauthorized() throw errors with these digests for Next's own boundary to act on, so catching one here would render the Fallback instead of navigating.
const NEXT_NAVIGATION_DIGESTS = ['NEXT_REDIRECT', 'NEXT_HTTP_ERROR_FALLBACK', 'NEXT_NOT_FOUND']
const isNextNavigation = (value: unknown) => {
  if (typeof value !== 'object' || value === null || !('digest' in value)) return false
  const { digest } = value
  return (
    typeof digest === 'string' && NEXT_NAVIGATION_DIGESTS.some((prefix) => digest.startsWith(prefix))
  )
}
interface ErrorBoundaryState {
  error: Error | null
}
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError = (error: unknown) => {
    if (isNextNavigation(error)) throw error
    return { error: toError(error) }
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', { error, errorInfo })
    this.props.onError?.(this.state.error ?? toError(error), errorInfo)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return (
      <this.props.Fallback
        error={this.state.error}
        reset={this.reset}
      />
    )
  }
}
