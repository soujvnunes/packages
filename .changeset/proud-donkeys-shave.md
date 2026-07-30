---
'@soujvnunes/prettier-config': minor
---

Set `proseWrap: 'never'` in the base config, so markdown prose is one line per paragraph.

These files are read by agents, not by a human in a fixed-width terminal. Hard-wrapping makes a one-word edit reflow the whole paragraph, which buries the real change in the diff and breaks exact-string edits whenever a wrap point moves. Prettier's default `preserve` only freezes whatever was authored, so it never enforced anything either way.

Consumers will see markdown reformatted on their next `prettier --write`. Pass `proseWrap: 'preserve'` to `createConfig()` to opt out.
