'use client'

import { useCallback, useState } from 'react'

import { useRouter } from 'next/navigation'

import { createHookedContext } from './createHookedContext'

interface PersistedToggleOptions<T extends string> {
  // Names the split contexts + hook errors, e.g. 'NavRail' → NavRailState / NavRailDispatch.
  name: string
  // Cookie key the value persists to; the consumer's server seed-leaf reads it to seed `defaultValue`.
  cookie: string
  // Allowed values, non-empty. The first is the fallback when the cookie is absent/invalid, and
  // omitting the dispatch argument cycles to the next value in this order (the "toggle").
  values: readonly [T, ...T[]]
  // Cookie lifetime in seconds (default one year).
  maxAge?: number
}

// Server-seeded, cookie-persisted UI state (nextjs-conventions §21 split State/Dispatch + §5 cookie seed): a client Provider seeded from the server-read cookie whose dispatch writes the cookie back and calls `router.refresh()` so the server re-renders from it. The `defaultValue` prop is whatever the consumer's server seed-leaf read, so validate the raw cookie with the returned `isValue`. This owns only the persisted axis; a feature layers transient state (a mobile sheet), a keyboard shortcut, or route-change resets on top.
export const createPersistedToggle = <T extends string>({
  name,
  cookie,
  values,
  maxAge = 31536000,
}: PersistedToggleOptions<T>) => {
  const State = createHookedContext<T>(`${name}State`)
  const Dispatch = createHookedContext<(next?: T) => void>(`${name}Dispatch`)

  // Narrows a raw cookie string to an allowed value, for the server seed-leaf (§5).
  const isValue = (value: string | undefined): value is T =>
    value !== undefined && (values as readonly string[]).includes(value)

  const Provider = ({
    defaultValue = values[0],
    children,
  }: {
    defaultValue?: T
    children: React.ReactNode
  }) => {
    const [state, setState] = useState<T>(() => defaultValue)
    const router = useRouter()

    const dispatch = useCallback(
      (next?: T) => {
        const nextIndex = (values.indexOf(state) + 1) % values.length
        const resolved = next ?? values.at(nextIndex) ?? values[0]

        setState(resolved)
        // Encode the value (a consumer's `values` are arbitrary strings, and an unescaped `;`/`,` would truncate the cookie) and scope it with SameSite=Lax. No `Secure`, because this is a non-sensitive UI preference and `Secure` would drop the cookie over plain-http local dev.
        document.cookie = `${cookie}=${encodeURIComponent(resolved)}; path=/; max-age=${maxAge}; SameSite=Lax`
        router.refresh()
      },
      [router, state],
    )

    return (
      <Dispatch.Context value={dispatch}>
        <State.Context value={state}>{children}</State.Context>
      </Dispatch.Context>
    )
  }

  return { State, Dispatch, Provider, isValue }
}
