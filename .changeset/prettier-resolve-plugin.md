---
'@soujvnunes/prettier-config': patch
---

Resolve `prettier-plugin-tailwindcss` to an absolute path (`require.resolve` from this package) instead of a bare module name. Under pnpm's non-hoisted layout the bundled plugin lives in this package's tree, not the consumer's root, so prettier's bare-string resolution against the consumer failed with `Cannot find package 'prettier-plugin-tailwindcss'`. An absolute path loads regardless of the consumer's hoisting.
