---
'@soujvnunes/eslint-config': minor
---

Add `soujvnunes/one-line-comments`, an own fixable rule, on at error. A comment occupies exactly one line however long it runs, so two failures are reported: any two adjacent own-line comments (a bare `//` between them does not make them two comments) and any block comment spanning lines, JSDoc included. A single-line `/** ... */` is fine. The fixer joins a run into one `//` and collapses a block to one line, so adoption is an `eslint --fix` pass rather than hand work.

The package now also exports `oneLineComments` and `oneLineCommentsPlugin` for wiring the rule on its own. `createBaseConfig` and `createNextConfig` are unchanged.

The rule works from comment tokens, never a line scan, so a line inside a template literal that starts with `//` is not a comment and is never reported.

Four things it deliberately does NOT do, each because doing them corrupts code:

- **A run containing a directive is exempt entirely.** Joining puts prose in front of the keyword and the tool stops seeing the directive, so a suppressed error silently returns; hoisting the directive instead yields an unknown-rule error that is neither fixable nor suppressible. A mixed `@ts-expect-error` plus `eslint-disable-next-line` run has no correct one-line form at all, since TypeScript skips intervening comment lines when matching its directive and ESLint does not. Covers the ESLint, TypeScript, Prettier, coverage, triple-slash reference and bundler pragma families.
- **A run holding a block comment reports without a fix.** Rebuilding it as `//` from its value keeps the JSDoc star as content, so the symbol stops carrying documentation and `no-deprecated` goes quiet at every call site, and a `/*!` banner a minifier is meant to keep would be flattened.
- **Adjacent JSX comment containers report without a fix.** Merging `{/* a */}` with `{/* b */}` means editing sibling nodes, and range surgery there can swallow a value-bearing expression.
- **A block that holds the only line break between two tokens is reported without a fix.** A multi-line block comment counts as a line terminator for automatic semicolon insertion, so collapsing one can change what a function returns.
- **A collapse that would emit a line terminator, lose the `/**` marker, or manufacture an early `*/` is refused.** The JSDoc star is content rather than a delimiter, so the interior is sliced off the raw text and every fix asserts on its finished string.

It runs on its own config block covering `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts` and `.cts`, because the main block's glob reaches only the first four and a rule placed there would silently skip the rest.
