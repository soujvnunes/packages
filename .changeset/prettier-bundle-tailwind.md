---
'@soujvnunes/prettier-config': patch
---

Bundle `prettier-plugin-tailwindcss` as a dependency (it was an optional peer), so `createConfig()` is self-contained — Tailwind consumers no longer have to install the plugin themselves. Non-Tailwind consumers strip it via `plugins: []` as before.
