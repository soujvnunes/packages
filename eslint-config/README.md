# @soujvnunes/eslint-config

Shared flat ESLint config as factories. It bundles the plugin set (typescript-eslint, import-x, import-helpers, unused-imports, security, and for the Next preset react, react-hooks, jsx-a11y, `@next/next`), so you only bring `eslint` and `typescript`. The Next preset also bundles the TypeScript import resolver (`eslint-import-resolver-typescript`, wired via `import-x/resolver-next`), so `@/...` path aliases and `.d.ts` types resolve out of the box, with no extra install and no `settings` wiring. The resolver is passed as an object, which sidesteps pnpm's bare-name resolution, and runs with `alwaysTryTypes`, so a value import resolves its `@types/*` package; it finds `tsconfig.json` from the working directory, and a repo with a tsconfig elsewhere appends its own resolver through `extend`. The base preset stays on import-x's built-in node resolver.

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
| `tailwindEntryPoint` | (none) | Tailwind v4 CSS entry path. When set on the Next preset, wires `eslint-plugin-better-tailwindcss` correctness rules such as `no-unknown-classes`, which flags a class not registered in the theme. The stylistic rules stay off, since `prettier-plugin-tailwindcss` already owns class order |
| `extend` | `[]` | Extra flat-config objects appended at the end |

Type-aware rules use typescript-eslint's **project service**, so no `parserOptions.project` wiring is needed. It discovers the nearest `tsconfig.json` per file.

## Built-in exemptions

- A config file or script at the repo root (`*.{mjs,js,ts,mts,cts}`) may default-export, so `import-x/no-default-export` and `no-restricted-syntax` are off there.
- On the Next preset, the file conventions Next requires to default-export (`page`, `layout`, `error`, `loading`, `not-found`, `proxy`, `middleware`, `sitemap`, `robots` and the rest) get the same exemption. `proxy` and `middleware` are both listed, since a repo can be on either name.
- `scripts/**/*.mjs` gets Node globals and `no-console` off, because printing is a script's job.
- The comment rules run in a block of their own on `**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}`, with their own `plugins`, since the main block's glob stops at `.js`, `.jsx`, `.ts` and `.tsx` and would never reach an `.mjs`, `.cjs`, `.mts` or `.cts` file.

## Style rules worth knowing before you adopt

These are the opinions most likely to surprise an existing codebase. All of them autofix except where noted.

**No blank lines between statements.** `padding-line-between-statements` is `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so a blank line between two statements is an error and `--fix` removes it. This covers the import block too: `import-helpers/order-imports` runs with `newlinesBetween: 'never'` and `import-x/newline-after-import` is off, so groups stay ordered without being separated by whitespace. Blank lines inside a template literal are content and are left alone.

**No warning severity.** Every rule either fails or is not present. A deliberate exception is an `eslint-disable` comment rather than a warning, and `reportUnusedDisableDirectives` is on, so a disable comment that suppresses nothing is itself an error.

**No comments in code: `soujvnunes/no-comments`.** It reports every comment in a JS or TS file except two kinds. A tool directive that does work stays, matched by name: `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`, `prettier-ignore`, `biome-ignore`, a coverage pragma (`istanbul`, `c8`, `v8`, `node:coverage`), a minifier annotation (`@__PURE__`, `#__NO_SIDE_EFFECTS__` and the rest of the `__NAME__` family), a `webpack` or `turbopack` magic comment, `@vite-ignore`, `//# sourceMappingURL`, a triple-slash reference, `/* global */`, `@jsx` with its `Frag`, `ImportSource` and `Runtime` forms, `@vitest-environment`, `@jest-environment`, `@refresh reset`, `@license`, `@preserve`, `@format`, `@prettier`, `@internal` standing alone (read by TypeScript's `stripInternal`; with prose after it, it is a JSDoc like any other), `gitleaks:allow` anywhere in a one-line comment that shares its line with code, before it or after it (gitleaks reads it only on the line of the finding), the `/*!` banner and the `#!` line. Any other comment that opens with `@` or `#`, such as `// @todo`, is prose and reports. In a `.js`, `.mjs`, `.cjs` or `.jsx` file a JSDoc whose first tag is a type annotation `checkJs` reads (`@type`, `@typedef`, `@callback`, `@satisfies`, `@template`, `@param`, `@returns`, `@import`, `@enum`, `@extends`, `@augments`, `@implements`, `@this`, `@overload`) and carries the type the tag takes (a `{Type}` after `@type`, `@param`, `@returns`, `@return`, `@satisfies`, `@enum` and `@this`; a `{Type}` or a name that ends its line after `@typedef` and `@callback`; a `{constraint}` or a comma list of names that ends its line after `@template`; a `{Type}` or a type that ends its line after `@extends`, `@augments` and `@implements`; an `import` clause with its `from` after `@import`; a typed `@param` or `@returns` later in the same comment after `@overload`), stays as well, wherever it sits, since deleting it removes the type check. A JSDoc stays when it sits directly above an exported symbol (an `export * from` included, and a top-level declaration a later `export { X }`, `export default X` or `export = X` names, the shape every shadcn/ui primitive ends with), or above a declaration, member, property or signature whose parents reach an exported declaration before a statement boundary (a block, a function body, a non-exported top-level statement): a member of an exported class, interface, type or enum, index, call and construct signatures included, a key of an exported object, and a field of a type literal in a parameter, a generic argument or an array type. Everything inside a `declare global` block or a `declare module 'name'` block counts as exported, and so, in a file with no import or export, does every top-level declaration of a `.d.ts` file and every ambient one of any other file (a `declare const`, `function`, `class` or `namespace` with all it holds, an interface such as `interface Window`, a type alias), since those declarations are global. The rule reads the syntax, not the tsconfig: under `moduleDetection: "force"` (the Vite templates set it) or a `"type": "module"` package on `nodenext`, TypeScript treats every file as a module, so such a declaration is local there, and the rule keeps a doc it could report. In a module file a `declare namespace` is local to the file: its members count only when the namespace itself is exported. So does an `export` inside any namespace: it publishes the member only as far as the namespace is published. A factory documents what it returns on the members of an exported interface it declares as its return type: a JSDoc on a local binding the factory returns is reported, and TypeScript's declaration emit leaves it out of the inferred return type anyway. A JSDoc above anything else, a `{/* */}` in JSX and a comment inside a JSX tag are reported like any other comment. The fix deletes the comment: its whole line when it stands alone, back to the code when it trails, and one space when code sits on both sides. Six cases are left to the author: a JSX container between text, a comment inside a tag, a multi-line comment with code on both of its edges (deleting it could join two lines that semicolon insertion keeps apart), a misplaced JSDoc holding an `@` tag, a JSDoc holding an em dash, and a JSDoc that would reach an export only through an argument of a call or a `new`, such as a key in `export default defineConfig({ ... })`. The exported type there is the call's return type, which drops the doc for `defineConfig(config: UserConfig): UserConfig` and keeps it for `Object.freeze` or a generic identity helper, and the rule cannot see the signature, so it reports without a fix. `{ jsdoc: 'never' }` reports the exported JSDoc too. A reason the code cannot carry belongs in the README. Both presets turn it on at error, beside `soujvnunes/one-line-comments`, which still collapses a multi-line JSDoc on an export to one line.

**Type-aware rules are enabled**, including `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-deprecated` and `no-unnecessary-type-assertion`. These need the project service, which is wired by default (see above). They are the rules most likely to surface real findings in a codebase adopting this config, and most are not autofixable.

**`security/detect-object-injection` is not included.** It predates TypeScript narrowing and reports every `obj[key]`, including keys already narrowed to a literal union and plain array indexes. Use `noUncheckedIndexedAccess` and an own-key (`Object.hasOwn`) guard instead.

**Two client-boundary rules on the Next preset, neither autofixable.** Both read `.jsx` and `.tsx` files that open with `'use client'`, and skip `error` and `global-error`, which Next requires to be client components.

- `soujvnunes/no-needless-use-client` reports the directive only when the file holds nothing a server module could not: it works from an allow-list rather than a list of known needs. Every module-level statement has to be an import with bindings (or a stylesheet), a type, a function declaration, a constant whose value, pattern defaults and markup included, builds by running nothing (literals, functions, objects and arrays of those, reads off local constants, and `cva`, `tv`, `memo` or `forwardRef`), or an export of a PascalCase component or a type; a side-effect import, an `if`, a call, `client-only`, `next/dynamic` and any value re-export each keep the directive. Every tag has to be one a server component can render: a tag name, an import, one level into a namespace import (`LabelPrimitive.Root`, and named imports from `radix-ui`, which exports namespaces), a component declared at module level, or a tag the parent passed in whose default passes the same test; an alias (`const MotionDiv = motion.div`), a styled tag, a higher-order result, or anything shaped like a context provider (a name ending in `Context`, `Ctx` or `Provider` under any import alias, or one lone `value` attribute on an element with children) does not qualify. Every value handed to a component, as a prop, a spread, a child, or a tag's `ref`, `action` or `formAction`, has to be data: literals (a RegExp is not), JSX, the props the component received, and objects, arrays and constants built only from those. A default, in a parameter, a destructured local or any pattern enclosing them, counts only when its value is data; a callback's argument is not a prop; a reassigned `let`, an object written through a member, a mutating method (`push`, `splice`) or a call it is handed to, and a key a later spread may replace are not data; and a read that names a string, array, number or object method (`LABEL.toUpperCase`, `ROWS.map`) is a function. A tag's other attributes and children can only hold data anyway, and `className` is a string by contract. On top of that, a hook call, `createContext`, `createPortal` or `flushSync` (matched by both the local and the imported name, so an alias hides neither), an `on*` handler, a class component or a browser-only global read as a value (bare or through `globalThis`) keeps the directive. A file without the directive still runs on the client when a client component imports it, so the fix is to delete the line.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements, or a run of static siblings under a dynamic parent, that reads only literals, imports and module-level constants whose value is itself static. It reports only in a file that needs the client, or whose directive is kept by disabling the other rule (file-wide, on the line before, or on the same line), since in any other file that rule's fix, deleting the directive, already moves the markup to the server. The two rules share one analysis per file. The tags have to pass the same test as above and be the same on every render, no handler, `ref` or form action may sit on a tag, and a value handed to a component may not be a bare import, a namespace member or anything holding one, since that is most likely a function; a read through a named import (a copy dictionary) is static. Markup a library callback or an event handler builds is skipped, since no server parent exists to take it. That markup ships to the browser and hydrates for nothing. Render it in the server parent and pass it in as `children` or a named `ReactNode` prop; moving it to a file without the directive does not help while the client file imports it. The threshold is the `minElements` option.

Measured on a Next app with 77 client files, with the TypeScript parser and browser globals the preset uses: the first rule found the 3 wrappers around a Radix primitive and `cn()` that were known to be needless, and nothing else once `error` files were exempt; the second found 16 static subtrees in 8 files, every one a block of labels and inputs or a heading a server parent could render. A threshold of two elements found 43, most of them label and input pairs that are not worth a refactor.

Adopting this in an existing repo is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.
