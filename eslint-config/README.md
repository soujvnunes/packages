# @soujvnunes/eslint-config

Shared flat ESLint config as factories. Bundles the plugin set (typescript-eslint, import-x, import-helpers, unused-imports, security, and — for the Next preset — react, react-hooks, jsx-a11y, `@next/next`); you only bring `eslint` + `typescript`.

## Install

```bash
pnpm add -D @soujvnunes/eslint-config eslint typescript
```

## Use

```js
// eslint.config.mjs — a Next.js app
import { createNextConfig } from '@soujvnunes/eslint-config'

export default createNextConfig({
  // project-specific import-order groups (skeleton is react → next → module → parent → sibling → index)
  importGroups: [
    '/^react/',
    '/^next/',
    'module',
    '/@/shared/',
    '/@/features/',
    'parent',
    'sibling',
    'index',
  ],
  ignores: ['generated/**'],
})
```

```js
// eslint.config.mjs — a TypeScript library
import { createBaseConfig } from '@soujvnunes/eslint-config'

export default createBaseConfig()
```

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `importGroups` | react → next → module → parent → sibling → index | Full import-order groups; insert your `@/…` paths |
| `ignores` | — | Extra ignore globs, merged after the built-in defaults |
| `tsconfigRootDir` | `process.cwd()` | Root for typescript-eslint's project service |
| `extend` | `[]` | Extra flat-config objects appended at the end |

Type-aware rules use typescript-eslint's **project service**, so no `parserOptions.project` wiring is needed — it discovers the nearest `tsconfig.json` per file.
