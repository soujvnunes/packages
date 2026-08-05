import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary'

const Fallback = ({ error, reset }: ErrorBoundaryFallbackProps) => (
  <button onClick={reset}>{error.message}</button>
)

const Boom = ({ throws = true }: { throws?: boolean }) => {
  if (throws) throw new Error('Boom.')

  return <span>recovered</span>
}

beforeEach(() => {
  // React and componentDidCatch both report a caught render error; silence them so a passing run stays readable.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
})

describe('ErrorBoundary', () => {
  it('renders its children while nothing throws', () => {
    render(
      <ErrorBoundary Fallback={Fallback}>
        <span>content</span>
      </ErrorBoundary>,
    )

    expect(screen.getByText('content')).toBeDefined()
  })

  it('renders the Fallback with the caught error', () => {
    render(
      <ErrorBoundary Fallback={Fallback}>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Boom.')).toBeDefined()
  })

  it('calls onError with the error and the component stack', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary
        Fallback={Fallback}
        onError={onError}>
        <Boom />
      </ErrorBoundary>,
    )

    const [error, errorInfo] = onError.mock.calls[0] ?? []

    expect(onError).toHaveBeenCalledOnce()
    expect(error).toBeInstanceOf(Error)
    expect(errorInfo).toHaveProperty('componentStack')
  })

  it('catches without an onError, since it is optional', () => {
    expect(() =>
      render(
        <ErrorBoundary Fallback={Fallback}>
          <Boom />
        </ErrorBoundary>,
      ),
    ).not.toThrow()

    expect(screen.getByText('Boom.')).toBeDefined()
  })

  it('renders children again after reset, once the child stops throwing', () => {
    const { rerender } = render(
      <ErrorBoundary Fallback={Fallback}>
        <Boom />
      </ErrorBoundary>,
    )

    rerender(
      <ErrorBoundary Fallback={Fallback}>
        <Boom throws={false} />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByText('Boom.'))

    expect(screen.getByText('recovered')).toBeDefined()
  })

  it("passes Next's digest through to the Fallback", () => {
    const digested = Object.assign(new Error('Server error'), { digest: 'abc123' })
    const Thrower = () => {
      throw digested
    }
    const DigestFallback = ({ error }: ErrorBoundaryFallbackProps) => <span>{error.digest}</span>

    render(
      <ErrorBoundary Fallback={DigestFallback}>
        <Thrower />
      </ErrorBoundary>,
    )

    expect(screen.getByText('abc123')).toBeDefined()
  })
})
