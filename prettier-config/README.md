# @soujvnunes/prettier-config

Shared Prettier config as a factory. No semicolons, single quotes, trailing commas, 104 width, Tailwind class sorting.

## Install

```bash
pnpm add -D @soujvnunes/prettier-config prettier prettier-plugin-tailwindcss
```

`prettier-plugin-tailwindcss` is an optional peer — only needed if you keep the default `plugins`.

## Use

```js
// prettier.config.mjs
import { createConfig } from '@soujvnunes/prettier-config'

// Defaults (Tailwind stylesheet at ./app/tailwind.config.css):
export default createConfig()

// Override the stylesheet path (src/ layout):
export default createConfig({ tailwindStylesheet: './src/app/tailwind.config.css' })

// Drop Tailwind entirely (non-Tailwind repo):
export default createConfig({ plugins: [], tailwindFunctions: [] })
```

Any [Prettier option](https://prettier.io/docs/options) passed in overrides the base.
