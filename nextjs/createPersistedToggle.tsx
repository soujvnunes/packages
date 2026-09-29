'use client'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHookedContext } from '@soujvnunes/react/createHookedContext'
interface PersistedToggleOptions<T extends string> {
  name: string
  cookie: string
  values: readonly [T, ...T[]]
  maxAge?: number
}
export const createPersistedToggle = <T extends string>({
  name,
  cookie,
  values,
  maxAge = 31536000,
}: PersistedToggleOptions<T>) => {
  const State = createHookedContext<T>(`${name}State`)
  const Dispatch = createHookedContext<(next?: T) => void>(`${name}Dispatch`)
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
