# @soujvnunes/react

## 0.5.1

### Patch Changes

- f47d087: `ErrorBoundary` now catches any thrown value other than Next's navigation errors, and hands the Fallback and `onError` the same `Error`. A falsy throw (`throw null`, `throw ''`) used to land in state as a falsy error, so the boundary rendered its children again and the error escaped with no Fallback and no `onError` call. A value that is not an `Error` is now wrapped in one: its message is the value's string `message` when it has one (an API error object), otherwise the value as a string, or `A non-Error value was thrown` when it cannot become one, and the original is on `cause`. An `Error` passes through as the same object, one from another realm included unless it sets its own `Symbol.toStringTag`, so Next's `digest` still reaches the Fallback.

  The boundary also rethrows the errors Next's `redirect()`, `notFound()`, `forbidden()` and `unauthorized()` throw, so they reach Next's own boundary and navigate instead of rendering the Fallback.

## 0.5.0

### Minor Changes

- 97f8dac: **Breaking.** Removed `./createPersistedToggle` and the `next` peer dependency. It moved to `@soujvnunes/nextjs/createPersistedToggle`, since it was the only export in this package that needed Next.js, and the peer dependency bled onto every consumer regardless of which export they used.

## 0.4.3

### Patch Changes

- 89df975: Swept em dashes out of every source comment and package description, per the house plain-writing voice. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.4.2

### Patch Changes

- 9a76f9c: Docs: rewrite the package READMEs in the house plain voice (no em dashes, no AI tells). No code or API change.

## 0.4.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.4.0

### Minor Changes

- 5c5ba7c: Add `createPersistedToggle({ name, cookie, values, maxAge? })`, a server-seeded, cookie-persisted UI-state factory. Returns `{ State, Dispatch, Provider, isValue }`: the client `Provider` seeds from a server-read cookie and its dispatch writes the cookie back + calls `router.refresh()` so the server re-renders from it; omitting the dispatch argument cycles through `values` (the toggle); `isValue` narrows a raw cookie string for the server seed-leaf. It owns only the persisted axis — a feature layers transient state, shortcuts, or route-change resets on top. Adds `next` as an optional peer (uses `next/navigation`).

  Also refines `createHookedContext`: its returned `Context` is now typed `React.Context<State>` (the internal `UNPROVIDED` sentinel no longer leaks into the public type) — runtime-identical, and it lets factories like `createPersistedToggle` compose it without a `.d.ts` emit error.

## 0.3.0

### Minor Changes

- bc54544: **Breaking.** `createContextWithHook` → **`createHookedContext`**, now returning an object `{ Context, useHook }` instead of a `[Context, useHook]` tuple — render `<X.Context value={…}>` and read with `X.useHook()`. Also **removed** `./createApi` and `./readNdjson` (moved to `@soujvnunes/util`, as neither uses React). Remaining subpaths: `./createHookedContext`, `./ErrorBoundary`, `./motion`.

## 0.2.0

### Minor Changes

- 69eefec: `createApi` redesigned to be **throw-free**: always returns an `ApiResponse<T>` envelope (now handles `!response.ok` as well as network/parse errors), and ships the `createApiResponseSuccess` / `createApiResponseError` envelope builders — the `onError` callback is gone. `motion` references React types via the ambient `React.*` namespace instead of a named `react` type import.

## 0.1.0

### Minor Changes

- 608e584: Initial release: React utilities as optional-peer subpaths — `./createContextWithHook` (context + guarded hook factory), `./ErrorBoundary` (class boundary with a `Fallback` prop), `./createApi` (fetch factory), `./readNdjson` (ndjson stream reader), `./motion` (`isEmptyAnimatePresence`).
