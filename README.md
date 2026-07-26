# @soujvnunes/packages

Monorepo for the shared `@soujvnunes/*` packages.

## Packages

| Package                                            | What                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| [`@soujvnunes/eslint-config`](./eslint-config)     | Flat ESLint config factories (`createBaseConfig`, `createNextConfig`) |
| [`@soujvnunes/prettier-config`](./prettier-config) | Prettier config factory (`createConfig`)                              |

Planned: `@soujvnunes/utils`, `@soujvnunes/react`, `@soujvnunes/mongodb`.

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
pnpm lint
pnpm format
pnpm changeset   # record a change for release
```
