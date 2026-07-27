# @soujvnunes/react

## 0.3.0

### Minor Changes

- bc54544: **Breaking.** `createContextWithHook` → **`createHookedContext`**, now returning an object `{ Context, useHook }` instead of a `[Context, useHook]` tuple — render `<X.Context value={…}>` and read with `X.useHook()`. Also **removed** `./createApi` and `./readNdjson` (moved to `@soujvnunes/util`, as neither uses React). Remaining subpaths: `./createHookedContext`, `./ErrorBoundary`, `./motion`.

## 0.2.0

### Minor Changes

- 69eefec: `createApi` redesigned to match the house §26 pattern: **throw-free**, always returns an `ApiResponse<T>` envelope (now handles `!response.ok` as well as network/parse errors), and ships the `createApiResponseSuccess` / `createApiResponseError` envelope builders — the `onError` callback is gone. `motion` references React types via the ambient `React.*` namespace instead of a named `react` type import.

## 0.1.0

### Minor Changes

- 608e584: Initial release: React utilities as optional-peer subpaths — `./createContextWithHook` (context + guarded hook factory), `./ErrorBoundary` (class boundary with a `Fallback` prop), `./createApi` (fetch factory), `./readNdjson` (ndjson stream reader), `./motion` (`isEmptyAnimatePresence`).
