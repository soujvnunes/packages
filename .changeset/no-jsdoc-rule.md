---
'@soujvnunes/eslint-config': minor
---

`soujvnunes/no-comments` now reports every JSDoc that no tool reads. The exception that kept a JSDoc on an exported symbol, on a member of an exported class, interface, type or enum, and on a key of an exported object is removed, and so is the `jsdoc` option: passing `{ jsdoc: 'never' }` is now a config error, so drop it. A JSDoc whose only content is a `@deprecated` tag stays, in JS and TS, beside the type annotations in a JS file and a lone `@internal`. The fix no longer deletes a comment that is all a block holds, since that left an empty block `no-empty` reports. Before adopting this version, remove the JSDoc comments a codebase still carries, or expect the lint to report each one.
