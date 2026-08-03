# @soujvnunes/util

Zero-dependency TypeScript utilities. Each is a subpath export, so you import exactly what you use. (No npm dependencies — `createApi`/`readNdjson` use the platform `fetch` / `ReadableStream`.)

## Install

```bash
pnpm add @soujvnunes/util
```

## Use

```ts
import { ellipses } from '@soujvnunes/util/ellipses'
import { objectHas } from '@soujvnunes/util/objectHas'
import { devLog } from '@soujvnunes/util/devLog'
import { matchesQuery } from '@soujvnunes/util/matchesQuery'
import { formatTimestamp } from '@soujvnunes/util/formatTimestamp'
import { getErrorMessage } from '@soujvnunes/util/getErrorMessage'
import { isConnectionError } from '@soujvnunes/util/isConnectionError'
import { buildQueryString } from '@soujvnunes/util/buildQueryString'
import { createApi } from '@soujvnunes/util/createApi'
import { readNdjson } from '@soujvnunes/util/readNdjson'
```

| Subpath | Export | What |
| --- | --- | --- |
| `./ellipses` | `ellipses` | Truncate a string to `head…tail` |
| `./objectHas` | `objectHas` | Narrow an untrusted key to `keyof O` (own-key check) |
| `./devLog` | `devLog` | Scope-tagged `console.log`, no-op outside `NODE_ENV=development` |
| `./matchesQuery` | `matchesQuery` | Validate + type-narrow `searchParams` against an allow-list schema |
| `./formatTimestamp` | `formatTimestamp` | `Intl.DateTimeFormat` wrapper (locale-aware) |
| `./getErrorMessage` | `getErrorMessage` | Message from an unknown thrown value, else a fallback |
| `./isConnectionError` | `isConnectionError` | `true` for a network failure (`ECONNREFUSED` / `fetch failed`) |
| `./buildQueryString` | `buildQueryString` | Flat params → `?a=1&b=2` (skips `null`/`undefined`) |
| `./createApi` | `createApi` (+ envelope builders) | Throw-free `fetch` factory → `ApiResponse<T>` (nextjs-conventions §26) |
| `./readNdjson` | `readNdjson` | Async generator over a newline-delimited-JSON `ReadableStream` |

### `createApi` — throw-free fetch factory

`createApi({ baseURL, headers? })` returns a typed `api<T>(endpoint, options?)` that always resolves to an `ApiResponse<T>` — a non-ok status or a network/parse error becomes an error envelope, never a rejection. Ships `createApiResponseSuccess` / `createApiResponseError` so the server builds the same shape. Callers branch on `.success`; a server action returns the message through `useActionState` — no try/catch, no `onError` callback (§26/§38).

```ts
// shared/lib/api.ts — 'use server'
import { createApi } from '@soujvnunes/util/createApi'

export const api = createApi({ baseURL: process.env.API_URL! })
// const res = await api<User>('/user/1'); if (!res.success) return { error: res.message }
```
