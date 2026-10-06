---
'@soujvnunes/stylelint-config': patch
---

The published type file no longer carries a doc comment, so `createConfig` shows no doc text on hover. Nothing else changed: the compiled output with the comment removed is the same as before. The README already says what the comment did: `rules` passed to `createConfig` merge onto the base rules, any other Stylelint option replaces, and `ignoreFiles` is the common override.
