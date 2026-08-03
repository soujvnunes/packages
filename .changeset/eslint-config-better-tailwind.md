---
'@soujvnunes/eslint-config': minor
---

`createNextConfig` gains an optional `tailwindEntryPoint`, the path to the Tailwind v4 CSS entry (the file with `@import "tailwindcss"` + `@theme`, e.g. `./app/tailwind.config.css`). When set, it wires the bundled `eslint-plugin-better-tailwindcss` correctness rules: `no-unknown-classes` (flags a class not registered in the theme, the dead token `tsc` and the build cannot see), `no-conflicting-classes`, and `no-concatenated-classes`. Only the correctness rules run, since class ordering stays with `prettier-plugin-tailwindcss`. Leave the option unset and the plugin stays off, so there is no behaviour change; without the entry the rule cannot resolve the theme and would flag every class. `tailwindcss` is an optional peer, and the plugin needs Node 20.19 or newer.
