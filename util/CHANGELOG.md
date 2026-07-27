# @soujvnunes/util

## 0.2.0

### Minor Changes

- a67f664: Add `./createApi` (throw-free fetch factory + `ApiResponse` envelope builders) and `./readNdjson` (ndjson stream reader) — moved here from `@soujvnunes/react`, since neither touches React. Zero npm dependencies (they use the platform `fetch` / `ReadableStream`).

## 0.1.0

### Minor Changes

- ff99ea2: Initial release: zero-dependency utilities — `ellipses`, `objectHas`, `devLog`, `matchesQuery`, `formatTimestamp`, each a subpath export.
