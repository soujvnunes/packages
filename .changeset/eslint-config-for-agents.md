---
'@soujvnunes/eslint-config': minor
---

Tune the config for the reader it actually has, which is an agent.

**No blank lines between statements.** `padding-line-between-statements` is inverted to `{ blankLine: 'never', prev: '*', next: '*' }` with no exceptions, so padding is an error and `--fix` strips it. `import-helpers/order-imports` moves to `newlinesBetween: 'never'` and `import-x/newline-after-import` is dropped, so the import block loses its separators too; grouping and order still hold, they are just no longer spelled with whitespace. Padding was 13.7% of the lines in the reference consumer and carried nothing a parser or a reader needs, while inflating every file read, every `file:line` reference and every diff. Applying it to this monorepo removed 19.6% of its lines.

**Every rule is an error; there are no warnings.** A warning is a finding nobody has to act on, so it survives indefinitely and an agent re-reads and re-dismisses the same pile every run, unable to tell old noise from what it just broke. Promoted: `no-explicit-any`, `no-non-null-assertion`, `no-nested-ternary`, `no-console`, `security/detect-non-literal-regexp`, `react/display-name`, `react/no-array-index-key`, `react/no-danger`, `react-hooks/exhaustive-deps`, `import-helpers/order-imports`. Added `linterOptions.reportUnusedDisableDirectives: 'error'` so a disable comment that suppresses nothing fails too.

**Type-aware rules that catch what review misses**, all newly on: `no-floating-promises` (was explicitly `off`), `no-misused-promises`, `await-thenable`, `no-deprecated`, `no-unnecessary-type-assertion`. These catch a promise nobody awaited and an API that was current in a model's training data but is deprecated now. On the reference consumer they found 3 real un-awaited calls, 1 misused promise and 2 deprecated APIs in shipped code.

**Removed `security/detect-object-injection`.** It predates TypeScript narrowing and fires on every `obj[key]`, including keys already narrowed to a literal union and plain array indexes inside `.map()`. It was 33 of the 35 findings on the reference consumer, all false. `noUncheckedIndexedAccess` and the `objectHas` own-key guard cover the real case with types instead of a heuristic.

**Removed `lines-around-comment`**, which never ran: `eslint-config-prettier` is applied after the rule set and turns it off.

Adopting this in a consumer is one `eslint --fix` plus a short list of real fixes. On the reference consumer that was 1746 findings, 1735 of them autofixable, leaving 11 by hand, every one a genuine bug or a piece of already-tracked debt.
