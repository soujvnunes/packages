---
'@soujvnunes/react': minor
---

**Breaking.** `createContextWithHook` → **`createHookedContext`**, now returning an object `{ Context, useHook }` instead of a `[Context, useHook]` tuple — render `<X.Context value={…}>` and read with `X.useHook()`. Also **removed** `./createApi` and `./readNdjson` (moved to `@soujvnunes/util`, as neither uses React). Remaining subpaths: `./createHookedContext`, `./ErrorBoundary`, `./motion`.
