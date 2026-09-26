---
'@soujvnunes/eslint-config': minor
---

Add two rules on the Next preset, both at error, for `.jsx` and `.tsx` files that open with `'use client'`. Next's `error` and `global-error` files are skipped, since Next requires them to be client components.

- `soujvnunes/no-needless-use-client` reports the directive only when the file holds nothing a server module could not, judged by allow-list: server-safe module-level statements, component and type exports, tags a server component can render, and data handed to components, with no hook, handler, class component or browser global.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements (the `minElements` option), or a run of static siblings under a dynamic parent, that reads only literals, imports and module constants whose value is itself static, which ships to the browser and hydrates for nothing. It reports only in a file that needs the client, or whose directive is kept by disabling the other rule on its line, so the two rules never give contradictory fixes; they share one analysis per file.

Neither autofixes. The fix for the first is deleting the line; the fix for the second is rendering the markup in the server parent and passing it in as `children` or a named `ReactNode` prop.

Probed on a Next app with 77 client files: 3 needless directives, all known, and 16 static subtrees in 8 files, all blocks a server parent could render. Before `error` files were exempt the first rule also reported the 9 in that app, which is why they are skipped.

`oneLineCommentsPlugin` is now `soujvnunesPlugin`, one plugin object carrying all three rules. ESLint refuses two different plugin objects under one namespace, so a single object is what lets the rules share `soujvnunes/`. Its type now names only `meta`, the way typescript-eslint publishes its own plugin, since ESLint's plugin type rejects the context type of a typescript-eslint rule. The package now depends on `@typescript-eslint/utils`, already installed with `typescript-eslint`.
