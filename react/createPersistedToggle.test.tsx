import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPersistedToggle } from './createPersistedToggle'

const refresh = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const NavRail = createPersistedToggle({
  name: 'NavRail',
  cookie: 'nav',
  values: ['expanded', 'collapsed'],
})

const Reader = () => {
  const state = NavRail.State.useHook()
  const dispatch = NavRail.Dispatch.useHook()

  return (
    <>
      <span>{state}</span>
      <button onClick={() => dispatch()}>toggle</button>
      <button onClick={() => dispatch('expanded')}>expand</button>
    </>
  )
}

const clearCookies = () => {
  document.cookie.split(';').forEach((entry) => {
    const [name = ''] = entry.split('=')

    document.cookie = `${name.trim()}=; max-age=0; path=/`
  })
}

beforeEach(clearCookies)

afterEach(() => {
  refresh.mockClear()
  cleanup()
})

describe('isValue', () => {
  it('accepts an allowed value', () => {
    expect(NavRail.isValue('collapsed')).toBe(true)
  })

  it('rejects an unknown or absent cookie, so the seed-leaf falls back', () => {
    expect(NavRail.isValue('sideways')).toBe(false)
    expect(NavRail.isValue(undefined)).toBe(false)
    expect(NavRail.isValue('')).toBe(false)
  })
})

describe('Provider', () => {
  it('seeds from the value the server read', () => {
    render(
      <NavRail.Provider defaultValue="collapsed">
        <Reader />
      </NavRail.Provider>,
    )

    expect(screen.getByText('collapsed')).toBeDefined()
  })

  it('falls back to the first value when the server read nothing', () => {
    render(
      <NavRail.Provider>
        <Reader />
      </NavRail.Provider>,
    )

    expect(screen.getByText('expanded')).toBeDefined()
  })
})

describe('dispatch', () => {
  it('sets the value it is given', () => {
    render(
      <NavRail.Provider defaultValue="collapsed">
        <Reader />
      </NavRail.Provider>,
    )

    fireEvent.click(screen.getByText('expand'))

    expect(screen.getByText('expanded')).toBeDefined()
  })

  it('cycles to the next value when called with no argument', () => {
    render(
      <NavRail.Provider defaultValue="expanded">
        <Reader />
      </NavRail.Provider>,
    )

    fireEvent.click(screen.getByText('toggle'))

    expect(screen.getByText('collapsed')).toBeDefined()
  })

  it('wraps around at the end of the values', () => {
    render(
      <NavRail.Provider defaultValue="collapsed">
        <Reader />
      </NavRail.Provider>,
    )

    fireEvent.click(screen.getByText('toggle'))

    expect(screen.getByText('expanded')).toBeDefined()
  })

  it('persists the value to the cookie it was named with', () => {
    render(
      <NavRail.Provider defaultValue="expanded">
        <Reader />
      </NavRail.Provider>,
    )

    fireEvent.click(screen.getByText('toggle'))

    expect(document.cookie).toContain('nav=collapsed')
  })

  it('refreshes the route so the server re-renders from the cookie', () => {
    render(
      <NavRail.Provider defaultValue="expanded">
        <Reader />
      </NavRail.Provider>,
    )

    fireEvent.click(screen.getByText('toggle'))

    expect(refresh).toHaveBeenCalledOnce()
  })

  it('encodes the value, so a reserved character cannot truncate the cookie', () => {
    const Sort = createPersistedToggle({
      name: 'Sort',
      cookie: 'sort',
      values: ['name;asc', 'name;desc'],
    })
    const SortReader = () => {
      const state = Sort.State.useHook()
      const dispatch = Sort.Dispatch.useHook()

      return <button onClick={() => dispatch()}>{state}</button>
    }

    render(
      <Sort.Provider>
        <SortReader />
      </Sort.Provider>,
    )

    fireEvent.click(screen.getByText('name;asc'))

    expect(document.cookie).toContain('sort=name%3Bdesc')
  })
})

describe('the split State and Dispatch hooks', () => {
  it('each throw outside the Provider', () => {
    const StateOnly = () => <span>{NavRail.State.useHook()}</span>
    const DispatchOnly = () => <span>{typeof NavRail.Dispatch.useHook()}</span>

    expect(() => render(<StateOnly />)).toThrow(
      'useNavRailState must be used within NavRailStateContext',
    )
    expect(() => render(<DispatchOnly />)).toThrow(
      'useNavRailDispatch must be used within NavRailDispatchContext',
    )
  })
})
