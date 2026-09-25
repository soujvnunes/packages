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

**Two client-boundary rules on the Next preset, neither autofixable.** Both read `.jsx` and `.tsx` files that open with `'use client'`, and skip `error` and `global-error`, which Next requires to be client components.

- `soujvnunes/no-needless-use-client` reports the directive when nothing in the file needs it, and it only reports what it can prove. Any of these keeps the directive: a hook call or `createContext`, an `on*` handler, a browser-only global, a class component, an import of `next/dynamic`, a dot into anything but a namespace import (`Ctx.Provider`, `motion.div`), an export that is not a component (a `columns` array, a helper function), any value re-export, and a JSX prop, spread or child that is not provably data. Data here means literals, JSX, props the component received, and objects, arrays and module constants built only from those; an import, a call, a class instance or a function counts as a need, except inside `className`, which is a string by contract. A file without the directive still runs on the client when a client component imports it, so the fix is to delete the line.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements, or a run of static siblings under a dynamic parent, that reads only literals, imports and module-level constants whose value is itself static. The element types have to be intrinsic tags, imports or module-level components, and a bare import handed to a component attribute does not count as static, since it is most likely a function. That markup ships to the browser and hydrates for nothing. Render it in the server parent and pass it in as `children` or a named `ReactNode` prop; moving it to a file without the directive does not help while the client file imports it. The threshold is the `minElements` option.

Measured on a Next app with 77 client files, with the TypeScript parser and browser globals the preset uses: the first rule found the 3 wrappers around a Radix primitive and `cn()` that were known to be needless, and nothing else once `error` files were exempt; the second found 17 static subtrees in 9 files, every one a block of labels and inputs or a heading a server parent could render. A threshold of two elements found 49, most of them label and input pairs that are not worth a refactor.

Adopting this in an existing repo is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.
