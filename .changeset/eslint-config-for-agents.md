---
'@soujvnunes/eslint-config': minor
---

Stricter defaults, plus two rules removed.

**No blank lines between statements.** `padding-line-between-statements` is now `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so padding is an error and `--fix` removes it. This covers the import block: `import-helpers/order-imports` moves to `newlinesBetween: 'never'` and `import-x/newline-after-import` is dropped, so groups stay ordered without being separated by whitespace.

**No warning severity.** Every rule now either fails or is not present. Promoted to error: `no-explicit-any`, `no-non-null-assertion`, `no-nested-ternary`, `no-console`, `security/detect-non-literal-regexp`, `react/display-name`, `react/no-array-index-key`, `react/no-danger`, `react-hooks/exhaustive-deps`, `import-helpers/order-imports`. Adds `linterOptions.reportUnusedDisableDirectives: 'error'`, so a disable comment that suppresses nothing is an error too.

**Type-aware rules enabled**: `no-floating-promises` (previously `off`), `no-misused-promises`, `await-thenable`, `no-deprecated` and `no-unnecessary-type-assertion`. Most are not autofixable and are the likeliest source of real findings when adopting this release.

**Removed `security/detect-object-injection`.** It predates TypeScript narrowing and reports every `obj[key]`, including keys already narrowed to a literal union and plain array indexes. Use `noUncheckedIndexedAccess` and an own-key (`Object.hasOwn`) guard instead.

**Removed `lines-around-comment`**, which never took effect: `eslint-config-prettier` is applied after the rule set and disables it.

Upgrading is usually one `eslint --fix` pass plus a short list of genuine fixes from the type-aware rules.
