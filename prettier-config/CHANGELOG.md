# @soujvnunes/prettier-config

## 0.2.1

### Patch Changes

- 01a8110: Bundle `prettier-plugin-tailwindcss` as a dependency (it was an optional peer), so `createConfig()` is self-contained — Tailwind consumers no longer have to install the plugin themselves. Non-Tailwind consumers strip it via `plugins: []` as before.

## 0.2.0

### Minor Changes

- 9c63dde: Enforce the ambient-React convention. ESLint now bans importing the React default (`import React`), the React namespace (`import * as React`), and named React **type** imports — reference types via the ambient `React.*` namespace instead. Prettier collapses object literals onto a single line when they fit (`objectWrap: 'collapse'`), for smaller files.

## 0.1.0

### Minor Changes

- 57cc0bc: Initial release: shared ESLint config factories (`createBaseConfig`, `createNextConfig`) and the Prettier config factory (`createConfig`). Each takes an overrides object so consumers customize without forking.
