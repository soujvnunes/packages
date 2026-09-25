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
// The internal-slot check accepts an Error from another realm (an iframe, `node:vm`), which `instanceof` misses; the tag is trusted only when the value sets no `Symbol.toStringTag`, since a plain object can claim 'Error' with one, and the `try` covers a Proxy whose traps throw.
const isError = (value: unknown): value is Error => {
  try {
    if (value instanceof Error) return true
    return (
      typeof value === 'object' &&
      value !== null &&
      !(Symbol.toStringTag in value) &&
      Object.prototype.toString.call(value) === '[object Error]'
    )
  } catch {
    return false
  }
}
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
// Without the wrap, a falsy throw reads as no error in render and escapes, and any other non-Error reaches props typed as `Error`.
const toError = (value: unknown): Error =>
  isError(value) ? value : new Error(messageOf(value), { cause: value })
// redirect(), notFound(), forbidden() and unauthorized() throw errors with these digests for Next's own boundary to act on, so catching one here would render the Fallback instead of navigating.
const NEXT_NAVIGATION_DIGESTS = ['NEXT_REDIRECT', 'NEXT_HTTP_ERROR_FALLBACK', 'NEXT_NOT_FOUND']
const isNextNavigation = (value: unknown) => {
  try {
    if (typeof value !== 'object' || value === null || !('digest' in value)) return false
    const { digest } = value
    return (
      typeof digest === 'string' && NEXT_NAVIGATION_DIGESTS.some((prefix) => digest.startsWith(prefix))
    )
  } catch {
    return false
  }
}
interface ErrorBoundaryState {
  error: Error | null
  thrown?: unknown
}
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError = (error: unknown) => {
    if (isNextNavigation(error)) throw error
    return { error: toError(error), thrown: error }
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', { error, errorInfo })
    // React applies every error caught in one commit to state before the first componentDidCatch, so the Fallback's Error is reused only for the value it was made from.
    const { error: shown, thrown } = this.state
    this.props.onError?.(shown && Object.is(thrown, error) ? shown : toError(error), errorInfo)
  }

  reset = () => this.setState({ error: null, thrown: undefined })

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
