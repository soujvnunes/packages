# @soujvnunes/react

React utilities as **subpath exports with optional peers** — import a subpath and install only what it needs. `react` is an optional peer (the `createApi`/`readNdjson` subpaths need nothing at all); `motion` is optional and only the `./motion` subpath uses it.

## `./createContextWithHook` — context + guarded hook factory

Returns a `[Context, useContext]` pair whose hook throws if rendered with no provider above. Uses a private symbol sentinel, so a state that legitimately **is** `null` never triggers the "missing provider" error.

```bash
pnpm add @soujvnunes/react react
```

```tsx
'use client'
import { createContextWithHook } from '@soujvnunes/react/createContextWithHook'

const [RingContext, useRing] = createContextWithHook<Ring>('Ring')
// <RingContext value={ring}>…</RingContext>  →  const ring = useRing()
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

## `./createApi` — fetch factory

`createApi({ baseURL, headers?, onError })` binds a base URL + default JSON headers and returns a typed `api<T>(endpoint, options?)`. A network/parse failure resolves to `onError(error)` (your own error envelope) instead of rejecting — so the response shape stays yours, not the package's.

```ts
import { createApi } from '@soujvnunes/react/createApi'

export const api = createApi({
  baseURL: process.env.API_URL!,
  onError: (error) => ({ success: false as const, error: String(error) }),
})
// const res = await api<{ success: true; data: User }>('/users/1')
```

## `./readNdjson` — newline-delimited-JSON stream reader

Async generator that yields one typed value per `\n`-terminated line of a `ReadableStream` — buffers partial lines, yields any final unterminated line on close. Zero dependencies.

```ts
import { readNdjson } from '@soujvnunes/react/readNdjson'

for await (const event of readNdjson<ProgressEvent>(response.body!)) {
  // handle each event as it streams in
}
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
