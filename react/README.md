# @soujvnunes/react

React utilities as **subpath exports with optional peers** — import a subpath and install only what it needs. `react` is an optional peer; `motion` is optional and only the `./motion` subpath uses it. (The React-agnostic `createApi` + `readNdjson` moved to [`@soujvnunes/util`](../util).)

## `./createHookedContext` — context + guarded hook factory

`createHookedContext<State>(name)` returns `{ Context, useHook }`: render `<X.Context value={…}>` (React 19 context-as-provider) and read with `X.useHook()`, which throws if used with no provider above. A private symbol sentinel means a state that legitimately **is** `null` never trips the "missing provider" error.

```bash
pnpm add @soujvnunes/react react
```

```tsx
'use client'
import { createHookedContext } from '@soujvnunes/react/createHookedContext'

export const Ring = createHookedContext<RingState>('Ring')
// <Ring.Context value={ring}>…</Ring.Context>   →   const ring = Ring.useHook()
```

## `./ErrorBoundary` — class error boundary with a Fallback prop

Catches render errors and renders the `Fallback` you pass (receiving `{ error, reset }`); optional `onError` for logging. `error` carries Next's optional `digest`.

```tsx
import { ErrorBoundary, type ErrorBoundaryFallbackProps } from '@soujvnunes/react/ErrorBoundary'

const Fallback = ({ error, reset }: ErrorBoundaryFallbackProps) => (
  <button onClick={reset}>{error.message}</button>
)
// <ErrorBoundary Fallback={Fallback}>{children}</ErrorBoundary>
```

## `./motion` — motion helpers

`isEmptyAnimatePresence(node)` is `true` when a node is an `<AnimatePresence>` whose children are all falsy — lets a layout drop wrapper markup around an empty presence.

```bash
pnpm add @soujvnunes/react react motion
```

```tsx
import { isEmptyAnimatePresence } from '@soujvnunes/react/motion'

const visible = children.filter((child) => !isEmptyAnimatePresence(child))
```
