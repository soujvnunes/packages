---
'@soujvnunes/prettier-config': patch
---

The published type file no longer carries a doc comment, so `createConfig` shows no doc text on hover. Nothing else changed: the compiled output with the comment removed is the same as before. The README already says what the comment did: any Prettier option passed to `createConfig` overrides the base, and `tailwindStylesheet` is the common override.
