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
const isErrorConstructor = (value: unknown): value is ErrorConstructor => typeof value === 'function'
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
  it.each([
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
    ['an empty string', '', ''],
    ['a string', 'plain string', 'plain string'],
    ['an API error object', { message: 'Row not found', code: 'PGRST116' }, 'Row not found'],
    ['a null-prototype object', Object.create(null) as unknown, 'A non-Error value was thrown'],
    [
      'an object whose toString throws',
      {
        toString: () => {
          throw new Error('nope')
        },
      },
      'A non-Error value was thrown',
    ],
  ])(
    'wraps %s in one Error, with the value on cause, for both the Fallback and onError',
    (_, thrown, message) => {
      const onError = vi.fn()
      const seen = vi.fn()
      const Spy = ({ error }: ErrorBoundaryFallbackProps) => {
        seen(error)
        return <span>fallback</span>
      }
      const Thrower = () => {
        throw thrown
      }
      render(
        <ErrorBoundary
          Fallback={Spy}
          onError={onError}>
          <Thrower />
        </ErrorBoundary>,
      )
      const [error] = onError.mock.calls[0] ?? []
      expect(screen.getByText('fallback')).toBeDefined()
      expect(onError).toHaveBeenCalledOnce()
      expect(error).toBeInstanceOf(Error)
      expect(error).toMatchObject({ message, cause: thrown })
      expect(seen.mock.lastCall?.[0]).toBe(error)
    },
  )
  it('passes an Error from another realm through untouched, digest included', () => {
    const realm = document.body.appendChild(document.createElement('iframe')).contentWindow
    const ForeignError = realm && 'Error' in realm ? realm.Error : undefined
    if (!isErrorConstructor(ForeignError))
      throw new Error('jsdom gave the iframe no Error constructor.')
    const foreign = Object.assign(new ForeignError('Server error'), { digest: 'abc123' })
    expect(foreign instanceof Error).toBe(false)
    const onError = vi.fn()
    const Thrower = () => {
      throw foreign
    }
    render(
      <ErrorBoundary
        Fallback={({ error }) => <span>{`${error.message} ${error.digest ?? ''}`}</span>}
        onError={onError}>
        <Thrower />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Server error abc123')).toBeDefined()
    expect(onError.mock.calls[0]?.[0]).toBe(foreign)
  })
  it.each(['NEXT_REDIRECT;replace;/login;307;', 'NEXT_HTTP_ERROR_FALLBACK;404'])(
    "rethrows Next's %s navigation error for Next's own boundary, without the Fallback or onError",
    (digest) => {
      const navigation = Object.assign(new Error(digest), { digest })
      const onError = vi.fn()
      const Thrower = () => {
        throw navigation
      }
      expect(() =>
        render(
          <ErrorBoundary
            Fallback={Fallback}
            onError={onError}>
            <Thrower />
          </ErrorBoundary>,
        ),
      ).toThrow(navigation)
      expect(onError).not.toHaveBeenCalled()
    },
  )
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
