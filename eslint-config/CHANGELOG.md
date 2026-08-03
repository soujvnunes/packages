# @soujvnunes/eslint-config

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
