---
'@soujvnunes/util': minor
---

Three additions:

- `getErrorMessage(error, fallback?)` — extract a message from an unknown thrown value; `createApi`'s network/parse catch branch now uses it.
- `buildQueryString(params?)` — serialize a flat params object to a `?a=1&b=2` string (or '' when empty/nullish), skipping undefined/null.
- `isConnectionError(error)` — true for a network/connection failure (`ECONNREFUSED` / `fetch failed` / `Failed to fetch`). Auth/domain classifiers stay in the consumer (app-specific strings).

No behaviour change to `createApi`'s signature; the factory still logs nothing.
