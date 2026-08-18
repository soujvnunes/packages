# @soujvnunes/packages

[![CI](https://github.com/soujvnunes/packages/actions/workflows/ci.yml/badge.svg)](https://github.com/soujvnunes/packages/actions/workflows/ci.yml)

Monorepo for the shared `@soujvnunes/*` packages.

## Packages

| Package | What |
| --- | --- |
| [`@soujvnunes/eslint-config`](./eslint-config) | Flat ESLint config factories (`createBaseConfig`, `createNextConfig`) |
| [`@soujvnunes/prettier-config`](./prettier-config) | Prettier config factory (`createConfig`) |
| [`@soujvnunes/stylelint-config`](./stylelint-config) | Stylelint config factory (`createConfig`), standard rules plus Tailwind v4 at-rules |
| [`@soujvnunes/util`](./util) | Zero-dependency utilities (subpath exports): type guards, throw-free `fetch` (`createApi`), an NDJSON reader, query strings |
| [`@soujvnunes/lib`](./lib) | Stateful modules (subpath exports): a Mongoose client and Typegoose bases |
| [`@soujvnunes/react`](./react) | React utilities (subpath exports): hooked-context, error-boundary, motion |
| [`@soujvnunes/nextjs`](./nextjs) | Next.js utilities (subpath exports): server-seeded, cookie-persisted state (`createPersistedToggle`) |

Separate packages when deps are bundled (the configs); subpaths in one package when deps are peer or zero (`util`, `lib`, `react`, `nextjs`).

## Convention: the style is tuned for agents

This code is read far more often by an agent than by a person scrolling a file, so `@soujvnunes/eslint-config` optimises for that reader: no blank lines between statements (they were 13.7% of the lines in the reference consumer and stripping them took 19.6% off this monorepo), no warning severity anywhere (a warning is a finding nobody has to act on, so it accumulates until an agent cannot tell old noise from a fresh break), and type-aware rules for the mistakes review misses, such as an un-awaited promise or an API that was current in a model's training data and is deprecated now. The reasoning and the measurements are in [the config's README](./eslint-config#the-house-style-is-tuned-for-agents-not-for-skimming).

## Convention: every package is a customizable factory

Each package exposes a factory that takes an overrides object, so a consumer customizes without forking:

```js
// prettier.config.mjs
import { createConfig } from '@soujvnunes/prettier-config'
export default createConfig({ tailwindStylesheet: './src/app/tailwind.config.css' })

// eslint.config.mjs
import { createNextConfig } from '@soujvnunes/eslint-config'
export default createNextConfig({ ignores: ['generated/**'], importGroups: [/* project paths */] })
```

## Develop

```bash
pnpm install
pnpm test
pnpm lint
pnpm format
pnpm changeset   # record a change for release
```

Tests run on Vitest, one project per package, and sit next to the module they cover (`util/ellipses.ts` and `util/ellipses.test.ts`). The `react` project runs in jsdom against React Testing Library; every other project runs in node. Nothing reaches a real database or network: `lib/mongoose` runs against a mocked driver, and `createApi` against a stubbed `fetch`. CI runs `build`, `typecheck`, `test`, `lint`, and `format` on every pull request.
