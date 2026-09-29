'use client'
import { createContext, useContext } from 'react'
const UNPROVIDED: unique symbol = Symbol('unprovided')
export const createHookedContext = <State>(name: string) => {
  const Context = createContext<State | typeof UNPROVIDED>(UNPROVIDED)
  const useHook = () => {
    const context = useContext(Context)
    if (context === UNPROVIDED) throw new Error(`use${name} must be used within ${name}Context`)
    return context
  }
  return { Context: Context as React.Context<State>, useHook }
}
