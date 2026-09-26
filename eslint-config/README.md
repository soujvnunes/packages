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

- `soujvnunes/no-needless-use-client` reports the directive only when the file holds nothing a server module could not: it works from an allow-list rather than a list of known needs. Every module-level statement has to be an import with bindings (or a stylesheet), a type, a function declaration, a constant whose value, pattern defaults and markup included, builds by running nothing (literals, functions, objects and arrays of those, reads off local constants, and `cva`, `tv`, `memo` or `forwardRef`), or an export of a PascalCase component or a type; a side-effect import, an `if`, a call, `client-only`, `next/dynamic` and any value re-export each keep the directive. Every tag has to be one a server component can render: a tag name, an import, one level into a namespace import (`LabelPrimitive.Root`, and named imports from `radix-ui`, which exports namespaces), a component declared at module level, or a tag the parent passed in whose default passes the same test; an alias (`const MotionDiv = motion.div`), a styled tag, a higher-order result, or anything shaped like a context provider (a name ending in `Context`, `Ctx` or `Provider` under any import alias, or one lone `value` attribute on an element with children) does not qualify. Every value handed to a component, as a prop, a spread, a child, or a tag's `ref`, `action` or `formAction`, has to be data: literals (a RegExp is not), JSX, the props the component received, and objects, arrays and constants built only from those. A default, in a parameter, a destructured local or any pattern enclosing them, counts only when its value is data; a callback's argument is not a prop; a reassigned `let`, an object written through a member, a mutating method (`push`, `splice`) or a call it is handed to, and a key a later spread may replace are not data; and a read that names a string, array, number or object method (`LABEL.toUpperCase`, `ROWS.map`) is a function. A tag's other attributes and children can only hold data anyway, and `className` is a string by contract. On top of that, a hook call, `createContext`, `createPortal` or `flushSync` (matched by both the local and the imported name, so an alias hides neither), an `on*` handler, a class component or a browser-only global read as a value (bare or through `globalThis`) keeps the directive. A file without the directive still runs on the client when a client component imports it, so the fix is to delete the line.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements, or a run of static siblings under a dynamic parent, that reads only literals, imports and module-level constants whose value is itself static. It reports only in a file that needs the client, or whose directive is kept by disabling the other rule (file-wide, on the line before, or on the same line), since in any other file that rule's fix, deleting the directive, already moves the markup to the server. The two rules share one analysis per file. The tags have to pass the same test as above and be the same on every render, no handler, `ref` or form action may sit on a tag, and a value handed to a component may not be a bare import, a namespace member or anything holding one, since that is most likely a function; a read through a named import (a copy dictionary) is static. Markup a library callback or an event handler builds is skipped, since no server parent exists to take it. That markup ships to the browser and hydrates for nothing. Render it in the server parent and pass it in as `children` or a named `ReactNode` prop; moving it to a file without the directive does not help while the client file imports it. The threshold is the `minElements` option.

Measured on a Next app with 77 client files, with the TypeScript parser and browser globals the preset uses: the first rule found the 3 wrappers around a Radix primitive and `cn()` that were known to be needless, and nothing else once `error` files were exempt; the second found 16 static subtrees in 8 files, every one a block of labels and inputs or a heading a server parent could render. A threshold of two elements found 43, most of them label and input pairs that are not worth a refactor.

Adopting this in an existing repo is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.
