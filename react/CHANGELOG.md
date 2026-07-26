# @soujvnunes/react

## 0.2.0

### Minor Changes

- 69eefec: `createApi` redesigned to match the house §26 pattern: **throw-free**, always returns an `ApiResponse<T>` envelope (now handles `!response.ok` as well as network/parse errors), and ships the `createApiResponseSuccess` / `createApiResponseError` envelope builders — the `onError` callback is gone. `motion` references React types via the ambient `React.*` namespace instead of a named `react` type import.

## 0.1.0

### Minor Changes

- 608e584: Initial release: React utilities as optional-peer subpaths — `./createContextWithHook` (context + guarded hook factory), `./ErrorBoundary` (class boundary with a `Fallback` prop), `./createApi` (fetch factory), `./readNdjson` (ndjson stream reader), `./motion` (`isEmptyAnimatePresence`).
