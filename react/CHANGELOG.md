# @soujvnunes/react

## 0.4.2

### Patch Changes

- 9a76f9c: Docs: rewrite the package READMEs in the house plain voice (no em dashes, no AI tells). No code or API change.

## 0.4.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.4.0

### Minor Changes

- 5c5ba7c: Add `createPersistedToggle({ name, cookie, values, maxAge? })` — a server-seeded, cookie-persisted UI-state factory (nextjs-conventions §21 split State/Dispatch + §5 cookie seed). Returns `{ State, Dispatch, Provider, isValue }`: the client `Provider` seeds from a server-read cookie and its dispatch writes the cookie back + calls `router.refresh()` so the server re-renders from it; omitting the dispatch argument cycles through `values` (the toggle); `isValue` narrows a raw cookie string for the server seed-leaf. It owns only the persisted axis — a feature layers transient state, shortcuts, or route-change resets on top. Adds `next` as an optional peer (uses `next/navigation`).

  Also refines `createHookedContext`: its returned `Context` is now typed `React.Context<State>` (the internal `UNPROVIDED` sentinel no longer leaks into the public type) — runtime-identical, and it lets factories like `createPersistedToggle` compose it without a `.d.ts` emit error.

## 0.3.0

### Minor Changes

- bc54544: **Breaking.** `createContextWithHook` → **`createHookedContext`**, now returning an object `{ Context, useHook }` instead of a `[Context, useHook]` tuple — render `<X.Context value={…}>` and read with `X.useHook()`. Also **removed** `./createApi` and `./readNdjson` (moved to `@soujvnunes/util`, as neither uses React). Remaining subpaths: `./createHookedContext`, `./ErrorBoundary`, `./motion`.

## 0.2.0

### Minor Changes

- 69eefec: `createApi` redesigned to match the house §26 pattern: **throw-free**, always returns an `ApiResponse<T>` envelope (now handles `!response.ok` as well as network/parse errors), and ships the `createApiResponseSuccess` / `createApiResponseError` envelope builders — the `onError` callback is gone. `motion` references React types via the ambient `React.*` namespace instead of a named `react` type import.

## 0.1.0

### Minor Changes

- 608e584: Initial release: React utilities as optional-peer subpaths — `./createContextWithHook` (context + guarded hook factory), `./ErrorBoundary` (class boundary with a `Fallback` prop), `./createApi` (fetch factory), `./readNdjson` (ndjson stream reader), `./motion` (`isEmptyAnimatePresence`).
