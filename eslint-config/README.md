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

## The house style is tuned for agents, not for skimming

Most of what is opinionated here follows from one assumption: the code is read far more often by an agent than by a person scrolling a file. Three consequences, each measured on real repos rather than argued from taste.

**No blank lines between statements.** `padding-line-between-statements` is `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so padding is an error and `--fix` removes it. That includes the import block: `import-helpers/order-imports` runs `newlinesBetween: 'never'` and `import-x/newline-after-import` is off, so groups stay ordered without being spaced. Padding was 13.7% of the lines in the reference consumer while carrying nothing a parser or a reader needs, and it inflates every file read, every `file:line` reference and every diff. Running this over the monorepo removed 19.6% of its lines in one pass, tests unchanged.

This is a rule about whitespace, not about structure. Separation between two ideas is expressed by extracting a function or a module, which is what the blank line was only ever hinting at. Blank lines inside a template literal are content and are untouched.

**No warnings, only errors.** A warning is a finding nobody has to act on, so it accumulates: an agent re-reads and re-dismisses the same pile on every run and cannot tell old noise from what it just broke. Every rule here either fails the build or is not present. A deliberate exception is an `eslint-disable` comment, which records the decision next to the code, and `reportUnusedDisableDirectives` fails on a disable comment that suppresses nothing.

**Type-aware rules for the mistakes review misses.** `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-deprecated` and `no-unnecessary-type-assertion` are on. A promise nobody awaited and an API that was current in a model's training data but is deprecated today are both invisible in review and both caught here.

Two rules are deliberately absent. `security/detect-object-injection` predates TypeScript narrowing and fires on every `obj[key]`, including keys already narrowed to a literal union and plain array indexes inside `.map()`; it produced 33 of 35 findings on the reference consumer, all false, and `noUncheckedIndexedAccess` plus an own-key guard cover the real case with types. `@typescript-eslint/no-unnecessary-condition` looks like a good fit and is not: it flags guards whose types lie about runtime, such as `if (!navigator.clipboard)` (absent on non-HTTPS) and the `models.X || getModelForClass(X)` hot-reload guard, so following it deletes code that is load-bearing.

Adopting this in an existing repo is one `eslint --fix` plus a short list of real fixes. On the reference consumer: 1746 findings, 1735 autofixable, 11 by hand, every one a genuine bug.
