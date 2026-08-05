# @soujvnunes/stylelint-config

## 0.1.3

### Patch Changes

- 89df975: Swept em dashes out of every source comment and package description, per the house plain-writing voice. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.1.2

### Patch Changes

- 9a76f9c: Docs: rewrite the package READMEs in the house plain voice (no em dashes, no AI tells). No code or API change.

## 0.1.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.1.0

### Minor Changes

- 58d413f: New package: a shared Stylelint config factory mirroring `@soujvnunes/prettier-config`. `createConfig(overrides)` extends `stylelint-config-standard` (bundled as a dependency and resolved to an absolute path so pnpm consumers load it) and layers the house deviations — the Tailwind v4 at-rule allow-list (`theme`/`source`/`utility`/`variant`/`custom-variant` …), string `import-notation`, modern `color-function-notation`, and the relaxed selector/keyframes/custom-property patterns. `rules` merge onto the base; other keys (e.g. `ignoreFiles`) replace. Peer: `stylelint >=16`.
