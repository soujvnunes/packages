'use client'

import { createContext, useContext } from 'react'

// The "no provider above" sentinel is a module-private unique symbol, NOT null/undefined: a state can
// legitimately BE null (e.g. "no failure yet"), and a null sentinel would make the hook throw inside a
// perfectly mounted provider. The symbol can't collide with any real value.
const UNPROVIDED: unique symbol = Symbol('unprovided')

// Returns `{ Context, useHook }`: render `<X.Context value={…}>` (React 19 context-as-provider) and
// read with `X.useHook()`, which throws when used with no provider above — so callers get `State`,
// never a maybe-type.
export const createHookedContext = <State>(name: string) => {
  const Context = createContext<State | typeof UNPROVIDED>(UNPROVIDED)

  const useHook = () => {
    const context = useContext(Context)

    if (context === UNPROVIDED) throw new Error(`use${name} must be used within ${name}Context`)

    return context
  }

  return { Context, useHook }
}
