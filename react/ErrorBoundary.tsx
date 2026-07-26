'use client'

import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react'

interface FallbackError extends Error {
  digest?: string
}

export interface ErrorBoundaryFallbackProps {
  error: FallbackError
  reset: () => void
}

interface ErrorBoundaryProps {
  children: ReactNode
  Fallback: ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', {
      error,
      errorInfo,
    })
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({
      error: null,
    })
  }

  render() {
    if (this.state.error) {
      return (
        <this.props.Fallback
          error={this.state.error}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
}
