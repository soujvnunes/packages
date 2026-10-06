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
| `importGroups` | react, next, module, parent, sibling, index | Full import-order groups, which replace the default list; insert your `@/...` paths |
| `ignores` | (none) | Extra ignore globs, merged after the built-in defaults |
| `tsconfigRootDir` | `process.cwd()` | Root for typescript-eslint's project service |
| `tailwindEntryPoint` | (none) | Tailwind v4 CSS entry path: the file holding `@import "tailwindcss"` and `@theme`, such as `./app/tailwind.config.css`. When set on the Next preset, wires `eslint-plugin-better-tailwindcss` correctness rules such as `no-unknown-classes`, which flags a class not registered in the theme (a dead token neither `tsc` nor the build sees), and `no-restricted-classes`, which flags an arbitrary-value class such as `text-[11px]`. Left unset, the plugin stays off, since without the entry `no-unknown-classes` cannot resolve the theme and would flag every class. The stylistic rules stay off, since `prettier-plugin-tailwindcss` already owns class order |
| `allowArbitraryClasses` | `[]` | Utility prefixes exempt from the arbitrary-Tailwind-value ban, for a shape with no theme token (`['grid-cols']` for `grid-cols-[200px_1fr]`). Read only when `tailwindEntryPoint` is set |
| `classMergeName` | `'cn'` | The class-merge helper name a ternary passed straight to it is banned inside of |
| `nextConfigModules` | `[]` | Modules `next.config.*` loads, restricted to relative imports (`no-restricted-imports` on `['@/*']`) the same as a `next.config.ts`, `.mts` or `.cts` itself, on the Next preset |
| `strictExportGlobs` | `[]` | Globs wired to `soujvnunes/one-export-per-file`. With no globs the rule stays exported but off |
| `extend` | `[]` | Extra flat-config objects appended at the end |

Type-aware rules use typescript-eslint's **project service**, so no `parserOptions.project` wiring is needed. It discovers the nearest `tsconfig.json` per file.

## Built-in exemptions

- A config file or script at the repo root (`*.{mjs,js,ts,mts,cts}`) may default-export, so `import-x/no-default-export` is off there. `no-restricted-syntax` stays on for everything that is not about export shape: the file still keeps the react-import bans, the enum ban, the lucide/next-font/cloneElement bans and, on the Next preset, the `cn()`-ternary ban. Only the two export-default selectors drop.
- On the Next preset, the file conventions Next requires to default-export (`page`, `layout`, `error`, `loading`, `not-found`, `proxy`, `middleware`, `sitemap`, `robots` and the rest) get the same treatment: the export-default selectors drop, every other `no-restricted-syntax` selector stays, which is why a `lucide-react` import that does not end in `Icon` is still caught inside `page.tsx`. `proxy` and `middleware` are both listed, since a repo can be on either name.
- `scripts/**/*.mjs` gets Node globals and `no-console` off, because printing is a script's job.
- The comment rules run in a block of their own on `**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}`, with their own `plugins`, since the main block's glob stops at `.js`, `.jsx`, `.ts` and `.tsx` and would never reach an `.mjs`, `.cjs`, `.mts` or `.cts` file.
- `**/*.test.*` and `**/copy/**` are exempt from `max-lines`, since a test file's assertions and a copy dictionary's strings are not the same kind of length as logic.

## Style rules worth knowing before you adopt

These are the opinions most likely to surprise an existing codebase. All of them autofix except where noted.

**No blank lines between statements.** `padding-line-between-statements` is `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so a blank line between two statements is an error and `--fix` removes it. This covers the import block too: `import-helpers/order-imports` runs with `newlinesBetween: 'never'` and `import-x/newline-after-import` is off, so groups stay ordered without being separated by whitespace. Blank lines inside a template literal are content and are left alone.

**No warning severity.** Every rule either fails or is not present. A deliberate exception is an `eslint-disable` comment rather than a warning, and `reportUnusedDisableDirectives` is on, so a disable comment that suppresses nothing is itself an error.

**No comments in code: `soujvnunes/no-comments`.** It reports every comment in a JS or TS file, JSDoc included, except a tool directive. A tool directive that does work stays, matched by name: `eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`, `prettier-ignore`, `biome-ignore`, a coverage pragma (`istanbul`, `c8`, `v8`, `node:coverage`), a minifier annotation (`@__PURE__`, `#__NO_SIDE_EFFECTS__` and the rest of the `__NAME__` family), a `webpack` or `turbopack` magic comment, `@vite-ignore`, `//# sourceMappingURL`, a triple-slash reference, `/* global */`, `@jsx` with its `Frag`, `ImportSource` and `Runtime` forms, `@vitest-environment`, `@jest-environment`, `@refresh reset`, `@license`, `@preserve`, `@format`, `@prettier`, `@internal` standing alone (read by TypeScript's `stripInternal`; with prose after it, it is a JSDoc like any other), a JSDoc whose only content is a `@deprecated` tag with or without its sentence, on one line or several (read by editors and by `@typescript-eslint/no-deprecated`; another tag after it, or the same text in a `//` line, reports), `gitleaks:allow` anywhere in a one-line comment that shares its line with code, before it or after it (gitleaks reads it only on the line of the finding), the `/*!` banner and the `#!` line. Any other comment that opens with `@` or `#`, such as `// @todo`, is prose and reports. In a `.js`, `.mjs`, `.cjs` or `.jsx` file a JSDoc whose first tag is a type annotation `checkJs` reads (`@type`, `@typedef`, `@callback`, `@satisfies`, `@template`, `@param`, `@returns`, `@import`, `@enum`, `@extends`, `@augments`, `@implements`, `@this`, `@overload`) and carries the type the tag takes (a `{Type}` after `@type`, `@param`, `@returns`, `@return`, `@satisfies`, `@enum` and `@this`; a `{Type}` or a name that ends its line after `@typedef` and `@callback`; a `{constraint}` or a comma list of names that ends its line after `@template`; a `{Type}` or a type that ends its line after `@extends`, `@augments` and `@implements`; an `import` clause with its `from` after `@import`; a typed `@param` or `@returns` later in the same comment after `@overload`), stays as well, wherever it sits, since deleting it removes the type check. Every other JSDoc reports wherever it sits: above an exported symbol, on a member of an exported class, interface, type or enum, on a key of an exported object, in a `declare global` block and in a `.d.ts` file alike. The rule used to keep those and took a `jsdoc` option to report them; the option is gone, so passing it is a config error and a config that set `{ jsdoc: 'never' }` drops it. A `{/* */}` in JSX and a comment inside a JSX tag are reported like any other comment. The fix deletes the comment: its whole line when it stands alone, back to the code when it trails, and one space when code sits on both sides. Five cases are left to the author: a JSX container between text, a comment inside a tag, a multi-line comment with code on both of its edges (deleting it could join two lines that semicolon insertion keeps apart), a JSDoc holding an `@` tag, and a comment that is all a block holds, since deleting it would leave an empty block that `no-empty` reports (a function body is not such a block, since `no-empty` never reports one, so its lone comment is deleted). A reason the code cannot carry belongs in the README. Both presets turn it on at error, beside `soujvnunes/one-line-comments`, which still collapses a multi-line `@deprecated` JSDoc to one line.

**Type-aware rules are enabled**, including `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-deprecated` and `no-unnecessary-type-assertion`. These need the project service, which is wired by default (see above). They are the rules most likely to surface real findings in a codebase adopting this config, and most are not autofixable.

**`security/detect-object-injection` is not included.** It predates TypeScript narrowing and reports every `obj[key]`, including keys already narrowed to a literal union and plain array indexes. Use `noUncheckedIndexedAccess` and an own-key (`Object.hasOwn`) guard instead.

**Two client-boundary rules on the Next preset, neither autofixable.** Both read `.jsx` and `.tsx` files that open with `'use client'`, and skip `error` and `global-error`, which Next requires to be client components.

- `soujvnunes/no-needless-use-client` reports the directive only when the file holds nothing a server module could not: it works from an allow-list rather than a list of known needs. Every module-level statement has to be an import with bindings (or a stylesheet), a type, a function declaration, a constant whose value, pattern defaults and markup included, builds by running nothing (literals, functions, objects and arrays of those, reads off local constants, and `cva`, `tv`, `memo` or `forwardRef`), or an export of a PascalCase component or a type; a side-effect import, an `if`, a call, `client-only`, `next/dynamic` and any value re-export each keep the directive. Every tag has to be one a server component can render: a tag name, an import, one level into a namespace import (`LabelPrimitive.Root`, and named imports from `radix-ui`, which exports namespaces), a component declared at module level, or a tag the parent passed in whose default passes the same test; an alias (`const MotionDiv = motion.div`), a styled tag, a higher-order result, or anything shaped like a context provider (a name ending in `Context`, `Ctx` or `Provider` under any import alias, or one lone `value` attribute on an element with children) does not qualify. Every value handed to a component, as a prop, a spread, a child, or a tag's `ref`, `action` or `formAction`, has to be data: literals (a RegExp is not), JSX, the props the component received, and objects, arrays and constants built only from those. A default, in a parameter, a destructured local or any pattern enclosing them, counts only when its value is data; a callback's argument is not a prop; a reassigned `let`, an object written through a member, a mutating method (`push`, `splice`) or a call it is handed to, and a key a later spread may replace are not data; and a read that names a string, array, number or object method (`LABEL.toUpperCase`, `ROWS.map`) is a function. A tag's other attributes and children can only hold data anyway, and `className` is a string by contract. On top of that, a hook call, `createContext`, `createPortal` or `flushSync` (matched by both the local and the imported name, so an alias hides neither), an `on*` handler, a class component or a browser-only global read as a value (bare or through `globalThis`) keeps the directive. A file without the directive still runs on the client when a client component imports it, so the fix is to delete the line.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements, or a run of static siblings under a dynamic parent, that reads only literals, imports and module-level constants whose value is itself static. It reports only in a file that needs the client, or whose directive is kept by disabling the other rule (file-wide, on the line before, or on the same line), since in any other file that rule's fix, deleting the directive, already moves the markup to the server. The two rules share one analysis per file. The tags have to pass the same test as above and be the same on every render, no handler, `ref` or form action may sit on a tag, and a value handed to a component may not be a bare import, a namespace member or anything holding one, since that is most likely a function; a read through a named import (a copy dictionary) is static. Markup a library callback or an event handler builds is skipped, since no server parent exists to take it. That markup ships to the browser and hydrates for nothing. Render it in the server parent and pass it in as `children` or a named `ReactNode` prop; moving it to a file without the directive does not help while the client file imports it. The threshold is the `minElements` option.

Measured on a Next app with 77 client files, with the TypeScript parser and browser globals the preset uses: the first rule found the 3 wrappers around a Radix primitive and `cn()` that were known to be needless, and nothing else once `error` files were exempt; the second found 16 static subtrees in 8 files, every one a block of labels and inputs or a heading a server parent could render. A threshold of two elements found 43, most of them label and input pairs that are not worth a refactor.

This package's tests run every client-boundary case under two settings, espree with no globals and the Next preset's TypeScript parser with browser globals, since a global the config or a TypeScript lib declares resolves differently from an undeclared one.

Adopting this in an existing repo is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.

## Accessibility on the Next preset

`jsx-a11y`'s recommended rules run at error, not just registered with zero rules. `settings['jsx-a11y'].components` maps `Link` to `a`, `Image` to `img`, `Button` to `button` and `Input` to `input`, so a rule such as `anchor-is-valid` or `alt-text` reads through the wrapper to the native element it renders. Measured on a Next app with 676 source files: 7 real findings across 5 rules (`no-autofocus`, `click-events-have-key-events`, `no-noninteractive-element-interactions`, `no-static-element-interactions`, `anchor-has-content`), one of which is a component that forwards `children` only through `{...props}`, which the rule cannot see through; everything else was a genuine finding.

## New `no-restricted-syntax` selectors, and why page.tsx still gets them

`no-restricted-syntax` selectors now live in a keyed record composed per file convention, rather than one hardcoded array turned fully off on `page.tsx`, `layout.tsx` and root config files. Those two overrides now drop only the two export-default selectors (`page.tsx` and `next.config.ts` both need to default-export) and keep everything else: the enum ban, the react-import bans, and the three additions below. This is what makes a `lucide-react` import inside `page.tsx` still get caught.

- **A `lucide-react` import whose name does not end in `Icon`.** `import { Home } from 'lucide-react'` is reported; `import { HomeIcon } from 'lucide-react'` is not. `createLucideIcon`, `icons` and `dynamicIconImports` are exempt, since none of them is itself an icon, and a type-only import (`import type` or `{ type X }`) is exempt too. The check is on the imported name, not the local alias, so `import { Home as MyIcon }` still reports.
- **Any import from `next/font/google`.** Self-hosted fonts only (`FONTS`).
- **`cloneElement`**, both as a named import from `react` and as `React.cloneElement`.

Measured on a Next app: `lucide-react` and `cloneElement` both read 0 (the app already imports the `*Icon` names and never touches `cloneElement`), `next/font/google` read 1 (`src/app/layout.tsx`).

## Barrel files and feature roots, on the Next preset only

Two more `no-restricted-syntax` overrides, each adding a `Program` selector to the full selector list, so every matching file reports once whatever it contains, and the enum, react-import, `lucide-react`, `next/font/google`, `cloneElement` and `cn()` ternary bans still apply inside it:

- `**/index.{ts,tsx}` (outside `**/pages/**`) reports a barrel file outright: import each module by its own path instead of re-exporting through an aggregator.
- `**/features/*/*.{ts,tsx}` (outside its own `*.test.{ts,tsx}`) reports a file sitting loose at a feature's root: place it inside one of the feature's subfolders.

Both are Next-preset only, since a plain TypeScript library's `index.ts` is its npm entry point, not the barrel the Next convention (`MODULARITY`) warns about; `createBaseConfig` never sees either override, which is why this very package's own `eslint-config/index.ts` is not flagged by its own rule.

## `cn()` ternary ban, on the Next preset

`CallExpression[callee.name='cn'] > ConditionalExpression` is its own entry in the same selector composition, so the file-convention overrides above cannot drop it independently of the export-default filtering: it rides along with every other selector wherever `no-restricted-syntax` is set. The callee name comes from `classMergeName` (default `'cn'`), for a repo whose merge helper is named `clsx` or something else. Use a `cva` variant or an object entry instead of `cn(base, condition ? 'a' : 'b')`. Measured on a Next app: 16 sites across 9 files, 8 of them in one badge component.

## Arbitrary Tailwind values, when `tailwindEntryPoint` is set

`better-tailwindcss/no-restricted-classes` bans a bracketed value on a utility (`text-[11px]`, `tracking-[0.08em]`, `bg-[#000]/50`) while leaving a bracketed **variant** alone (`data-[state=open]:`, `group-data-[state=open]:`, `peer-data-[checked]:`, `supports-[display:grid]:`, `[&_>_svg]:`), since those precede a colon and the ban only matches the class's own trailing bracket. `allowArbitraryClasses` exempts a utility prefix that has no theme-token shape at all, such as `grid-cols` for `grid-cols-[200px_1fr]`. Measured on a Next app: 28 distinct values at 52 sites, mostly `text-[Npx]` and `tracking-[Nem]`, none of which has a matching theme token today.

## Module boundaries

- `nextConfigModules` restricts a `next.config.ts`, `.mts` or `.cts` and the modules it names to relative imports only (`no-restricted-imports` on `['@/*']`), on the Next preset. A `next.config.js` or `.mjs` is not linted at all, since `*.config.js` and `*.config.mjs` are in the default ignores; the modules it names still are. A config file that imports through the `@/...` alias resolves it differently at build time than the app does, so anything the config loads stays relative.
- `**/utils/**` restricts `server-only`, `next/*`, `react`, `@/lib/*` and `@/app/*` on both presets: a pure helper module takes data in and data out, never a server-only boundary or a framework import.

## `max-lines`: 300, skipping blank lines and comments

`**/*.test.*` and `**/copy/**` are exempt (a copy dictionary's length is strings, not logic). Probed on a Next app at 200 (28 hits), 250 (13 hits) and 300 (9 hits); 300 is the threshold this config ships, since it is the only one under 10.

## `soujvnunes/one-export-per-file`, wired only through `strictExportGlobs`

One value export per module; an interface, a type alias, or a type-only named export is free of the count. The rule is always exported from the plugin, so a consumer can wire it with `strictExportGlobs` once its own codebase is ready, but no preset turns it on by default. Probed on a read-only Next app with many small named constants and phase helpers grouped into a couple of files: 1,419 sites across 27 files, two files alone (a game-constants module and a phase-utilities module) accounting for 65 of them. That is well over the 20-file bar for adopting it by default, so it stays unwired there; a repo with smaller, more atomic modules already can wire it per folder with `strictExportGlobs`.
