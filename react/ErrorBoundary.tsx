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
// A thrown non-Error (`throw null`, a string) becomes an Error, so a falsy one still shows the Fallback and every reader gets the type it declares.
const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)))
interface ErrorBoundaryState {
  error: Error | null
}
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError = (error: unknown) => ({ error: toError(error) })

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', { error, errorInfo })
    this.props.onError?.(toError(error), errorInfo)
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
