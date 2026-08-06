# @soujvnunes/util

Zero-dependency TypeScript utilities. Each is a subpath export, so you import exactly what you use. (No npm dependencies: `createApi` and `readNdjson` use the platform `fetch` and `ReadableStream`.)

## Install

```bash
pnpm add @soujvnunes/util
```

| Subpath | Export | What |
| --- | --- | --- |
| [`./ellipses`](#ellipses-truncate-a-string-from-both-ends) | `ellipses` | Truncate a string to `head...tail` |
| [`./objectHas`](#objecthas-narrow-an-untrusted-key) | `objectHas` | Narrow an untrusted key to `keyof O` (own-key check) |
| [`./devLog`](#devlog-dev-only-trace-log) | `devLog` | Scope-tagged `console.log`, no-op outside `NODE_ENV=development` |
| [`./matchesQuery`](#matchesquery-validate-and-narrow-searchparams) | `matchesQuery` | Validate and type-narrow `searchParams` against an allow-list schema |
| [`./formatTimestamp`](#formattimestamp-locale-aware-date-formatting) | `formatTimestamp` | `Intl.DateTimeFormat` wrapper (locale-aware) |
| [`./getErrorMessage`](#geterrormessage-message-from-an-unknown-throw) | `getErrorMessage` | Message from an unknown thrown value, else a fallback |
| [`./isConnectionError`](#isconnectionerror-detect-a-network-failure) | `isConnectionError` | `true` for a network failure (`ECONNREFUSED` / `fetch failed`) |
| [`./buildQueryString`](#buildquerystring-flat-params-to-a-query-string) | `buildQueryString` | Flat params to `?a=1&b=2` (skips `null`/`undefined`) |
| [`./createApi`](#createapi-throw-free-fetch-factory) | `createApi` (+ envelope builders) | Throw-free `fetch` factory returning `ApiResponse<T>` |
| [`./readNdjson`](#readndjson-stream-newline-delimited-json) | `readNdjson` | Async generator over a newline-delimited-JSON `ReadableStream` |

## `./ellipses`: truncate a string from both ends

`ellipses(string, count = 3)` keeps `count` characters from each end and puts `...` between them, so the shape of an address or a hash stays recognisable. It throws when the input is shorter than `count * 2 + 3`, because truncating there would not save any characters.

```ts
import { ellipses } from '@soujvnunes/util/ellipses'

ellipses('0x71C7656EC7ab88b098defB751B7401B5f6d8976F') // '0x7...76F'
ellipses('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 6) // '0x71C7...d8976F'
```

## `./objectHas`: narrow an untrusted key

`objectHas(object, key)` is a type predicate over `Object.hasOwn`. It narrows a runtime string (a route param, a form field name, a search param) to `keyof O`, so the lookup that follows needs no assertion. The own-key check also rejects a key that is not on the shape, including `__proto__`.

```tsx
import { objectHas } from '@soujvnunes/util/objectHas'

const LOCALES = { en: 'English', pt: 'Português' }

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params

  if (!objectHas(LOCALES, lang)) notFound()

  return <h1>{LOCALES[lang]}</h1> // lang is 'en' | 'pt'
}
```

## `./devLog`: dev-only trace log

`devLog(scope, ...args)` prints `[scope]` plus the args when `NODE_ENV` is `development`, and does nothing otherwise. Use it to watch an async pipeline in the terminal without shipping the noise to production. The scope tag keeps interleaved parallel work readable.

```ts
import { devLog } from '@soujvnunes/util/devLog'

devLog('extraction', 'page', index, 'of', total)
// dev terminal: [extraction] page 3 of 12
```

## `./matchesQuery`: validate and narrow `searchParams`

`matchesQuery(query, schema)` checks a whole `searchParams` object against a schema mapping each param to its allowed values, and narrows every param to its literal union. A param is valid when absent or equal to one of the literals. A repeated param arrives as `string[]` and is rejected.

A schema value that names another schema key marks a dependency: the named param is valid only when its parent holds that value, and is required when it does.

```tsx
import { matchesQuery } from '@soujvnunes/util/matchesQuery'

const SCHEMA = { action: ['review', 'export'], export: ['csv', 'pdf'] } as const

type Query = Record<string, string | string[] | undefined>

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams

  if (!matchesQuery(query, SCHEMA)) notFound()

  // query.action is 'review' | 'export' | undefined, query.export is 'csv' | 'pdf' | undefined
  return (
    <Report
      action={query.action}
      format={query.export}
    />
  )
}

// ?action=export&export=csv  valid
// ?action=export             rejected, the dependent param is required
// ?export=csv                rejected, the parent does not hold 'export'
```

## `./formatTimestamp`: locale-aware date formatting

`formatTimestamp(value, lang)` formats a `Date` or a date string through `Intl.DateTimeFormat` with a fixed field set: numeric year, short month, 2-digit day, 2-digit hour and minute, 24-hour clock. Pass the request locale so the server and the client agree on the output. The clock time renders in the runtime timezone, so a server component and a browser can differ unless you pin `TZ`.

```ts
import { formatTimestamp } from '@soujvnunes/util/formatTimestamp'

formatTimestamp(entry.createdAt, 'en-US') // 'Aug 05, 2026, 14:30'
formatTimestamp('2026-08-05T14:30:00Z', 'pt-BR') // '05 de ago. de 2026, 14:30'
```

There is no options argument. A different field set means a local `Intl.DateTimeFormat`, not a wrapper around this one.

## `./getErrorMessage`: message from an unknown throw

`getErrorMessage(error, fallback = 'Something went wrong')` returns the `message` of an `Error` and the fallback for anything else. Use it at a boundary that must not rethrow, such as a server action returning through `useActionState`.

```ts
import { getErrorMessage } from '@soujvnunes/util/getErrorMessage'

export async function createEntry(_: State, formData: FormData) {
  try {
    return { data: await save(formData) }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save the entry.') }
  }
}
```

## `./isConnectionError`: detect a network failure

`isConnectionError(error)` is `true` when the message carries `ECONNREFUSED`, `fetch failed`, or `Failed to fetch`, which is the request never reaching the server. It reads the message because the platform rarely types these. Keep the auth and domain classifiers in the consumer, where their strings live.

It takes `unknown` and reads the message through [`getErrorMessage`](#geterrormessage-message-from-an-unknown-throw), so a `catch` binding goes straight in with no `instanceof Error` narrowing at the call site. A throw that is not an `Error` has no message to match and returns `false`.

```ts
import { isConnectionError } from '@soujvnunes/util/isConnectionError'
import { getErrorMessage } from '@soujvnunes/util/getErrorMessage'

try {
  await connectDb()
} catch (error) {
  if (isConnectionError(error)) return getErrorMessage(error, 'Cannot reach the database right now.')

  throw error
}
```

Nothing reaching this through `createApi` throws, because that envelope already carries the message. Use it around a client that does throw, such as Mongoose or a bare `fetch`.

## `./buildQueryString`: flat params to a query string

`buildQueryString(params)` serialises a flat object into a leading `?` plus the pairs. It skips `undefined` and `null`, coerces the rest with `String()`, and returns `''` when the object is empty or nullish, so it concatenates onto a path safely.

```ts
import { buildQueryString } from '@soujvnunes/util/buildQueryString'

const url = `/entries${buildQueryString({ page: 2, sort: 'name', cursor: null })}`
// '/entries?page=2&sort=name'

buildQueryString({}) // ''
buildQueryString(undefined) // ''
```

## `./createApi`: throw-free fetch factory

`createApi({ baseURL, headers? })` returns a typed `api<T>(endpoint, options?)` that always resolves to an `ApiResponse<T>`. A non-ok status or a network/parse error becomes an error envelope, never a rejection. It ships `createApiResponseSuccess` and `createApiResponseError` so the server builds the same shape. Callers branch on `.success`; a server action returns the message through `useActionState`, so there is no try/catch and no `onError` callback.

```ts
// shared/lib/api.ts, 'use server'
import { createApi } from '@soujvnunes/util/createApi'

export const api = createApi({ baseURL: process.env.API_URL! })
// const res = await api<User>('/user/1'); if (!res.success) return { error: res.message }
```

The route handler on the other end builds the same envelope, so `api()` passes its body straight through. `createApiResponseError()` defaults to status `404` and message `'Not found'`.

```ts
// app/api/user/[id]/route.ts
import { createApiResponseError, createApiResponseSuccess } from '@soujvnunes/util/createApi'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) return Response.json(createApiResponseError({ message: `No user ${id}.` }))

  return Response.json(createApiResponseSuccess(user))
}
```

Send that envelope with a 200. On a non-ok HTTP status `api()` stops reading the body and rebuilds the envelope from `response.status` and `response.statusText`, so the message the route wrote is lost. The status the caller reads comes from the envelope either way.

## `./readNdjson`: stream newline-delimited JSON

`readNdjson<T>(body)` is an async generator over a `ReadableStream`, yielding one parsed value per `\n`-terminated line. A partial trailing line is buffered until its newline arrives, and a final unterminated line is yielded on close. Use it client-side to consume a progress stream one event at a time.

```ts
import { readNdjson } from '@soujvnunes/util/readNdjson'

const res = await fetch('/api/extract', { method: 'POST', body })

if (!res.body) return

for await (const event of readNdjson<ProgressEvent>(res.body)) {
  setProgress(event.percent)
}
```
