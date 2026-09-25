---
'@soujvnunes/eslint-config': minor
---

Add two rules on the Next preset, both at error, for `.jsx` and `.tsx` files that open with `'use client'`. Next's `error` and `global-error` files are skipped, since Next requires them to be client components.

- `soujvnunes/no-needless-use-client` reports the directive when nothing in the file needs the client: no hook call, no event handler, no function handed to JSX, no browser global, no class component, no `createContext`, no `next/dynamic`. A re-export keeps its directive, since that is how a boundary goes around a dependency that ships none.
- `soujvnunes/no-static-jsx-in-client` reports a subtree of three or more elements (the `minElements` option) that reads only literals, imports and module-level constants, which ships to the browser and hydrates for nothing.

Neither autofixes. The fix for the first is deleting the line; the fix for the second is rendering the markup in the server parent and passing it in as `children` or a named `ReactNode` prop.

Probed before release on a Next app with 76 client files: 3 needless directives, all known, and 17 static subtrees in 8 files, all blocks a server parent could render. Before `error` files were exempt the first rule also reported the 9 in that app, which is why they are skipped.

`oneLineCommentsPlugin` is now `soujvnunesPlugin`, one plugin object carrying all three rules. ESLint refuses two different plugin objects under one namespace, so a single object is what lets the rules share `soujvnunes/`.
