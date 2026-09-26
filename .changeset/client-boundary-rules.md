---
'@soujvnunes/eslint-config': minor
---

Add two rules on the Next preset, both at error, for `.jsx` and `.tsx` files that open with `'use client'`. Next's `error` and `global-error` files are skipped, since Next requires them to be client components.

- `soujvnunes/no-needless-use-client` reports the directive when nothing in the file needs the client, and it only reports what it can prove: a hook call, a handler, a browser-only global, a class component, `next/dynamic` or `client-only`, a module-level statement, a dot into a named import or a context rendered as a provider, an export that is not a component, a value re-export, or a value handed to a component that is not provably data each keep the directive.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements (the `minElements` option), or a run of static siblings under a dynamic parent, in a component body, that reads only literals, imports and module constants whose value is itself static, which ships to the browser and hydrates for nothing.

Neither autofixes. The fix for the first is deleting the line; the fix for the second is rendering the markup in the server parent and passing it in as `children` or a named `ReactNode` prop.

Probed on a Next app with 77 client files: 3 needless directives, all known, and 17 static subtrees in 9 files, all blocks a server parent could render. Before `error` files were exempt the first rule also reported the 9 in that app, which is why they are skipped.

`oneLineCommentsPlugin` is now `soujvnunesPlugin`, one plugin object carrying all three rules. ESLint refuses two different plugin objects under one namespace, so a single object is what lets the rules share `soujvnunes/`. Its type now names only `meta`, the way typescript-eslint publishes its own plugin, since ESLint's plugin type rejects the context type of a typescript-eslint rule. The package now depends on `@typescript-eslint/utils`, already installed with `typescript-eslint`.
