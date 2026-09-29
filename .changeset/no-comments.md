---
'@soujvnunes/eslint-config': minor
---

New rule `soujvnunes/no-comments`, on at error in both `createBaseConfig` and `createNextConfig`, beside `soujvnunes/one-line-comments` on every JS and TS extension. It reports every comment in a code file: `//` and `/* */` comments, a `{/* */}` in JSX, a comment inside a JSX tag, and a JSDoc anywhere but directly above an exported symbol (`export * from` included) or a member of an exported class, interface, type or enum, signatures included.

What stays: tool directives that do work, matched by name (`eslint-disable`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`, `prettier-ignore`, coverage pragmas, minifier annotations such as `@__PURE__`, `@vite-ignore`, `//# sourceMappingURL`, triple-slash references, `/* global */`, `@jsx` and its variants, `@vitest-environment`, `@jest-environment`, `@refresh reset`, `@license`, `@preserve`, `@format`, `gitleaks:allow`), the `/*!` banner, the `#!` line, and the JSDoc on an export. A comment that only opens with `@` or `#`, such as `// @todo`, is prose and reports. `gitleaks:allow` and `@vitest-environment` are now directives for `one-line-comments` too. `{ jsdoc: 'never' }` reports the exported JSDoc as well, and a JSDoc holding an em dash is reported with no fix.

`eslint --fix` deletes the comment, so adopting it is one fix pass plus a short hand list: a JSX container between text, a comment inside a tag, a multi-line comment with code on both of its edges, and a misplaced JSDoc holding an `@` tag. Move any reason worth keeping to the README before the pass.
