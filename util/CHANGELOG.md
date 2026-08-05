# @soujvnunes/util

## 0.4.0

### Minor Changes

- 767ee7e: `isConnectionError` now takes `unknown` instead of `Error`, and reads the message through `getErrorMessage`. A `catch` binding goes straight in, with no `instanceof Error` narrowing at the call site. A throw that is not an `Error` has no message to match and returns `false`. Widening the parameter, so existing calls that already pass an `Error` keep working.

### Patch Changes

- 05e768c: `formatTimestamp` renders midnight as `00`, not `24`. It asked for `hour12: false`, which resolves to the h24 hour cycle in en-US and turned `00:05` into `24:05`. It now asks for `hourCycle: 'h23'`. Locales that already defaulted to h23, such as pt-BR and en-GB, are unaffected.
- 0118e03: `matchesQuery` reads the query through a `Map` instead of a computed property access. A schema key that names an inherited member, such as `constructor` or `toString`, now sees the param as absent rather than reading the prototype member off the object.
- 89df975: Swept em dashes out of every source comment and package description, per the house plain-writing voice. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.3.2

### Patch Changes

- 9a76f9c: Docs: rewrite the package READMEs in the house plain voice (no em dashes, no AI tells). No code or API change.

## 0.3.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

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
