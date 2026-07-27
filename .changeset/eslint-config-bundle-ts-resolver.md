---
'@soujvnunes/eslint-config': minor
---

Bundle the TypeScript import resolver into `createNextConfig`. Next configs now wire
`eslint-import-resolver-typescript` (added as a dependency) via `import-x/resolver-next`, passing the
resolver object rather than a bare name so pnpm's non-hoisted layout resolves it. Consumers no longer
install `eslint-import-resolver-typescript` or add a `settings['import-x/resolver']` block through
`extend` — `@/…` alias and `.d.ts` type resolution work out of the box. The base config
(`createBaseConfig`) is unchanged and stays on import-x's built-in node resolver.
