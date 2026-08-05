# @soujvnunes/eslint-config

## 0.4.1

### Patch Changes

- 89df975: Swept em dashes out of every source comment and package description, per the house plain-writing voice. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.4.0

### Minor Changes

- 4a644c0: `createNextConfig` gains an optional `tailwindEntryPoint`, the path to the Tailwind v4 CSS entry (the file with `@import "tailwindcss"` + `@theme`, e.g. `./app/tailwind.config.css`). When set, it wires the bundled `eslint-plugin-better-tailwindcss` correctness rules: `no-unknown-classes` (flags a class not registered in the theme, the dead token `tsc` and the build cannot see), `no-conflicting-classes`, and `no-concatenated-classes`. Only the correctness rules run, since class ordering stays with `prettier-plugin-tailwindcss`. Leave the option unset and the plugin stays off, so there is no behaviour change; without the entry the rule cannot resolve the theme and would flag every class. `tailwindcss` is an optional peer, and the plugin needs Node 20.19 or newer.

## 0.3.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.3.0

### Minor Changes

- cdbad60: Bundle the TypeScript import resolver into `createNextConfig`. Next configs now wire `eslint-import-resolver-typescript` (added as a dependency) via `import-x/resolver-next`, passing the resolver object rather than a bare name so pnpm's non-hoisted layout resolves it. Consumers no longer install `eslint-import-resolver-typescript` or add a `settings['import-x/resolver']` block through `extend` — `@/…` alias and `.d.ts` type resolution work out of the box. The base config (`createBaseConfig`) is unchanged and stays on import-x's built-in node resolver.

## 0.2.0

### Minor Changes

- 9c63dde: Enforce the ambient-React convention. ESLint now bans importing the React default (`import React`), the React namespace (`import * as React`), and named React **type** imports — reference types via the ambient `React.*` namespace instead. Prettier collapses object literals onto a single line when they fit (`objectWrap: 'collapse'`), for smaller files.

## 0.1.0

### Minor Changes

- 57cc0bc: Initial release: shared ESLint config factories (`createBaseConfig`, `createNextConfig`) and the Prettier config factory (`createConfig`). Each takes an overrides object so consumers customize without forking.
