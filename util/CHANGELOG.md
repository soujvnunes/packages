# @soujvnunes/util

## 0.3.0

### Minor Changes

- 6470af8: Three additions:

  - `getErrorMessage(error, fallback?)` — extract a message from an unknown thrown value; `createApi`'s network/parse catch branch now uses it.
  - `buildQueryString(params?)` — serialize a flat params object to a `?a=1&b=2` string (or '' when empty/nullish), skipping undefined/null.
  - `isConnectionError(error)` — true for a network/connection failure (`ECONNREFUSED` / `fetch failed` / `Failed to fetch`). Auth/domain classifiers stay in the consumer (app-specific strings).

  No behaviour change to `createApi`'s signature; the factory still logs nothing.

## 0.2.0

### Minor Changes

- a67f664: Add `./createApi` (throw-free fetch factory + `ApiResponse` envelope builders) and `./readNdjson` (ndjson stream reader) — moved here from `@soujvnunes/react`, since neither touches React. Zero npm dependencies (they use the platform `fetch` / `ReadableStream`).

## 0.1.0

### Minor Changes

- ff99ea2: Initial release: zero-dependency utilities — `ellipses`, `objectHas`, `devLog`, `matchesQuery`, `formatTimestamp`, each a subpath export.
