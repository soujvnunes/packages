# @soujvnunes/eslint-config

## 0.7.1

### Patch Changes

- 7bde219: `one-line-comments` treats a paragraph break inside a block comment the way it already treats a bare `//` between comment lines: two or more prose paragraphs make it a set of comments, reported without a fix, so a module header written as JSDoc is never welded into one line either. In a JSDoc the blank line before a tag block is that format's own layout rather than a second paragraph, so a description followed by `@param` still collapses. A `/*!` banner and a JSX comment are unaffected, since neither has a `//` form to move a paragraph into, and a break at either edge of the block is a stray that still collapses away. The verdict now lives in the one function that decides a block's legal one-line spelling, so it can no longer bypass the JSDoc, banner and JSX branches.

## 0.7.0

### Minor Changes

- aaba7eb: `one-line-comments` now reserves block comments for JSDoc, JSX and `/*!` banners. A single-line `/**` ends the run above it, so a `//` on the line before a JSDoc is legal; a JSDoc is out of place only when a prose comment sits directly under it, or when a prose doc is stacked on another doc, and that reports without a fix so its tags are never dropped. A directive line between a JSDoc and its code, and a tag-only doc stacked on another (`@typedef`, `@jsx` and `@jsxFrag`), stay legal. A plain `/* … */` outside JSX is an error, rewritten as `//` when nothing follows it on its line; a multi-line one collapses to `//` the same way, and a `/*!` banner collapses with its opener kept. A run of comment lines holding a bare `//` between two texts is a paragraph set: it reports without a fix and names the two remedies, one line per fact beside the code it describes, or moving the rationale out of the source. Machine-read annotations are exempt by shape rather than by list: a body opening with `@` or `#`, a block opening with a `tool:` prefix such as `node:coverage`, and every triple-slash directive.

## 0.6.0

### Minor Changes

- d1d877e: Add `soujvnunes/one-line-comments`, an own fixable rule, on at error. A comment occupies exactly one line however long it runs, so two failures are reported: any two adjacent own-line comments (a bare `//` between them does not make them two comments) and any block comment spanning lines, JSDoc included. A single-line `/** ... */` is fine. The fixer joins a run into one `//` and collapses a block to one line, so adoption is an `eslint --fix` pass rather than hand work.

  The package now also exports `oneLineComments` and `oneLineCommentsPlugin` for wiring the rule on its own. `createBaseConfig` and `createNextConfig` are unchanged.

  The rule works from comment tokens, never a line scan, so a line inside a template literal that starts with `//` is not a comment and is never reported.

  Four things it deliberately does NOT do, each because doing them corrupts code:

  - **A run containing a directive is exempt entirely.** Joining puts prose in front of the keyword and the tool stops seeing the directive, so a suppressed error silently returns; hoisting the directive instead yields an unknown-rule error that is neither fixable nor suppressible. A mixed `@ts-expect-error` plus `eslint-disable-next-line` run has no correct one-line form at all, since TypeScript skips intervening comment lines when matching its directive and ESLint does not. Covers the ESLint, TypeScript, Prettier, coverage, triple-slash reference and bundler pragma families.
  - **A run holding a block comment reports without a fix.** Rebuilding it as `//` from its value keeps the JSDoc star as content, so the symbol stops carrying documentation and `no-deprecated` goes quiet at every call site, and a `/*!` banner a minifier is meant to keep would be flattened.
  - **Adjacent JSX comment containers report without a fix.** Merging `{/* a */}` with `{/* b */}` means editing sibling nodes, and range surgery there can swallow a value-bearing expression.
  - **A block that holds the only line break between two tokens is reported without a fix.** A multi-line block comment counts as a line terminator for automatic semicolon insertion, so collapsing one can change what a function returns.
  - **A collapse that would emit a line terminator, lose the `/**` marker, or manufacture an early `*/` is refused.** The JSDoc star is content rather than a delimiter, so the interior is sliced off the raw text and every fix asserts on its finished string.

  It runs on its own config block covering `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts` and `.cts`, because the main block's glob reaches only the first four and a rule placed there would silently skip the rest.

## 0.5.1

### Patch Changes

- 97949e3: Exempt `proxy.{ts,tsx}` from `import-x/no-default-export` and `no-restricted-syntax` in the Next preset. Next 16 renamed the `middleware` file convention to `proxy`, and only `middleware` was listed, so a `proxy` file in the shape the framework requires could be flagged. `middleware` stays listed, since it is still valid on the edge runtime and a repo can be on either name.

## 0.5.0

### Minor Changes

- 8b722da: Stricter defaults, plus two rules removed.

  **No blank lines between statements.** `padding-line-between-statements` is now `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so padding is an error and `--fix` removes it. This covers the import block: `import-helpers/order-imports` moves to `newlinesBetween: 'never'` and `import-x/newline-after-import` is dropped, so groups stay ordered without being separated by whitespace.

  **No warning severity.** Every rule now either fails or is not present. Promoted to error: `no-explicit-any`, `no-non-null-assertion`, `no-nested-ternary`, `no-console`, `security/detect-non-literal-regexp`, `react/display-name`, `react/no-array-index-key`, `react/no-danger`, `react-hooks/exhaustive-deps`, `import-helpers/order-imports`. Adds `linterOptions.reportUnusedDisableDirectives: 'error'`, so a disable comment that suppresses nothing is an error too.

  **Type-aware rules enabled**: `no-floating-promises` (previously `off`), `no-misused-promises`, `await-thenable`, `no-deprecated` and `no-unnecessary-type-assertion`. Most are not autofixable and are the likeliest source of real findings when adopting this release.

  **Removed `security/detect-object-injection`.** It predates TypeScript narrowing and reports every `obj[key]`, including keys already narrowed to a literal union and plain array indexes. Use `noUncheckedIndexedAccess` and an own-key (`Object.hasOwn`) guard instead.

  **Removed `lines-around-comment`**, which never took effect: `eslint-config-prettier` is applied after the rule set and disables it.

  Upgrading is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.

## 0.4.1

### Patch Changes

- 89df975: Swept em dashes out of every source comment and package description, per the house plain-writing voice. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.4.0

### Minor Changes

- 4a644c0: `createNextConfig` gains an optional `tailwindEntryPoint`, the path to the Tailwind v4 CSS entry (the file with `@import "tailwindcss"` + `@theme`, e.g. `./app/tailwind.config.css`). When set, it wires the bundled `eslint-plugin-better-tailwindcss` correctness rules: `no-unknown-classes` (flags a class not registered in the theme, the dead token `tsc` and the build cannot see), `no-conflicting-classes`, and `no-concatenated-classes`. Only the correctness rules run, since class ordering stays with `prettier-plugin-tailwindcss`. Leave the option unset and the plugin stays off, so there is no behaviour change; without the entry the rule cannot resolve the theme and would flag every class. `tailwindcss` is an optional peer, and the plugin needs Node 20.19 or newer.

## 0.3.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.3.0

### Minor Changes

- cdbad60: Bundle the TypeScript import resolver into `createNextConfig`. Next configs now wire `eslint-import-resolver-typescript` (added as a dependency) via `import-x/resolver-next`, passing the resolver object rather than a bare name so pnpm's non-hoisted layout resolves it. Consumers no longer install `eslint-import-resolver-typescript` or add a `settings['import-x/resolver']` block through `extend` — `@/…` alias and `.d.ts` type resolution work out of the box. The base config (`createBaseConfig`) is unchanged and stays on import-x's built-in node resolver.

## 0.2.0

### Minor Changes

- 9c63dde: Enforce the ambient-React convention. ESLint now bans importing the React default (`import React`), the React namespace (`import * as React`), and named React **type** imports — reference types via the ambient `React.*` namespace instead. Prettier collapses object literals onto a single line when they fit (`objectWrap: 'collapse'`), for smaller files.

## 0.1.0

### Minor Changes

- 57cc0bc: Initial release: shared ESLint config factories (`createBaseConfig`, `createNextConfig`) and the Prettier config factory (`createConfig`). Each takes an overrides object so consumers customize without forking.
