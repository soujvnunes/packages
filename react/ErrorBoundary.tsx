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

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError = (error: Error) => ({ error })

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', { error, errorInfo })
    this.props.onError?.(error, errorInfo)
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
