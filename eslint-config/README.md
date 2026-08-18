# @soujvnunes/eslint-config

Shared flat ESLint config as factories. It bundles the plugin set (typescript-eslint, import-x, import-helpers, unused-imports, security, and for the Next preset react, react-hooks, jsx-a11y, `@next/next`), so you only bring `eslint` and `typescript`. The Next preset also bundles the TypeScript import resolver (`eslint-import-resolver-typescript`, wired via `import-x/resolver-next`), so `@/...` path aliases and `.d.ts` types resolve out of the box, with no extra install and no `settings` wiring.

## Install

```bash
pnpm add -D @soujvnunes/eslint-config eslint typescript
```

## Use

```js
// eslint.config.mjs, a Next.js app
import { createNextConfig } from '@soujvnunes/eslint-config'

export default createNextConfig({
  // project-specific import-order groups (skeleton is react, next, module, parent, sibling, index)
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
// eslint.config.mjs, a TypeScript library
import { createBaseConfig } from '@soujvnunes/eslint-config'

export default createBaseConfig()
```

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `importGroups` | react, next, module, parent, sibling, index | Full import-order groups; insert your `@/...` paths |
| `ignores` | (none) | Extra ignore globs, merged after the built-in defaults |
| `tsconfigRootDir` | `process.cwd()` | Root for typescript-eslint's project service |
| `tailwindEntryPoint` | (none) | Tailwind v4 CSS entry path. When set on the Next preset, wires `eslint-plugin-better-tailwindcss` correctness rules such as `no-unknown-classes`, which flags a class not registered in the theme |
| `extend` | `[]` | Extra flat-config objects appended at the end |

Type-aware rules use typescript-eslint's **project service**, so no `parserOptions.project` wiring is needed. It discovers the nearest `tsconfig.json` per file.

## Style rules worth knowing before you adopt

These are the opinions most likely to surprise an existing codebase. All of them autofix except where noted.

**No blank lines between statements.** `padding-line-between-statements` is `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so a blank line between two statements is an error and `--fix` removes it. This covers the import block too: `import-helpers/order-imports` runs with `newlinesBetween: 'never'` and `import-x/newline-after-import` is off, so groups stay ordered without being separated by whitespace. Blank lines inside a template literal are content and are left alone.

**No warning severity.** Every rule either fails or is not present. A deliberate exception is an `eslint-disable` comment rather than a warning, and `reportUnusedDisableDirectives` is on, so a disable comment that suppresses nothing is itself an error.

**Type-aware rules are enabled**, including `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-deprecated` and `no-unnecessary-type-assertion`. These need the project service, which is wired by default (see above). They are the rules most likely to surface real findings in a codebase adopting this config, and most are not autofixable.

**`security/detect-object-injection` is not included.** It predates TypeScript narrowing and reports every `obj[key]`, including keys already narrowed to a literal union and plain array indexes. Use `noUncheckedIndexedAccess` and an own-key (`Object.hasOwn`) guard instead.

Adopting this in an existing repo is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.
