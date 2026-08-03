# @soujvnunes/stylelint-config

Shared Stylelint config as a factory — extends `stylelint-config-standard` with Tailwind v4 at-rule support (`@theme`, `@utility`, `@variant`, `@custom-variant`, …), string `import-notation`, modern `color-function-notation`, and relaxed selector/keyframes/custom-property patterns.

## Install

```bash
pnpm add -D @soujvnunes/stylelint-config stylelint
```

`stylelint-config-standard` is bundled — you don't install it separately.

## Use

```js
// stylelint.config.mjs
import { createConfig } from '@soujvnunes/stylelint-config'

// Defaults:
export default createConfig()

// Ignore the Tailwind theme file (its generated custom properties trip the standard rules):
export default createConfig({ ignoreFiles: ['app/tailwind.config.css'] })
```

`rules` you pass merge onto the base; any other [Stylelint option](https://stylelint.io/user-guide/configure) (e.g. `ignoreFiles`) replaces. Peer: `stylelint >=16` (which needs Node ≥20.19).
