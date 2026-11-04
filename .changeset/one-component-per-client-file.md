---
'@soujvnunes/eslint-config': minor
---

Add `soujvnunes/one-component-per-client-file`, on at error in the Next preset's client-boundary block. In a file that opens with `'use client'` it keeps the first exported function component and reports every other module-level function declaration and every `const` holding a function, exported or not, unless that function's own body needs the browser (a hook or another client call, a handler or a function handed to a tag, a class component, a browser-only global) or the component hands it straight to client code (as an `on*` handler, a tag's `ref`, `action` or `formAction`, or a hook argument). A lowercase helper, a static sub-component and a second exported component that need no browser are reported; a `cva()` const and a closure inside the component are not. Expect it to report on a codebase whose client files carry helpers: move each one to its own module.
