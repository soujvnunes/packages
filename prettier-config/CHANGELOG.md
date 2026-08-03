# @soujvnunes/prettier-config

## 0.3.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.3.0

### Minor Changes

- 202b350: Set `proseWrap: 'never'` in the base config, so markdown prose is one line per paragraph.

  These files are read by agents, not by a human in a fixed-width terminal. Hard-wrapping makes a one-word edit reflow the whole paragraph, which buries the real change in the diff and breaks exact-string edits whenever a wrap point moves. Prettier's default `preserve` only freezes whatever was authored, so it never enforced anything either way.

  Consumers will see markdown reformatted on their next `prettier --write`. Pass `proseWrap: 'preserve'` to `createConfig()` to opt out.

## 0.2.2

### Patch Changes

- 52b22f3: Resolve `prettier-plugin-tailwindcss` to an absolute path (`require.resolve` from this package) instead of a bare module name. Under pnpm's non-hoisted layout the bundled plugin lives in this package's tree, not the consumer's root, so prettier's bare-string resolution against the consumer failed with `Cannot find package 'prettier-plugin-tailwindcss'`. An absolute path loads regardless of the consumer's hoisting.

## 0.2.1

### Patch Changes

- 01a8110: Bundle `prettier-plugin-tailwindcss` as a dependency (it was an optional peer), so `createConfig()` is self-contained — Tailwind consumers no longer have to install the plugin themselves. Non-Tailwind consumers strip it via `plugins: []` as before.

## 0.2.0

### Minor Changes

- 9c63dde: Enforce the ambient-React convention. ESLint now bans importing the React default (`import React`), the React namespace (`import * as React`), and named React **type** imports — reference types via the ambient `React.*` namespace instead. Prettier collapses object literals onto a single line when they fit (`objectWrap: 'collapse'`), for smaller files.

## 0.1.0

### Minor Changes

- 57cc0bc: Initial release: shared ESLint config factories (`createBaseConfig`, `createNextConfig`) and the Prettier config factory (`createConfig`). Each takes an overrides object so consumers customize without forking.
