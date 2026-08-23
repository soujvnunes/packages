---
'@soujvnunes/eslint-config': patch
---

Exempt `proxy.{ts,tsx}` from `import-x/no-default-export` and `no-restricted-syntax` in the Next preset. Next 16 renamed the `middleware` file convention to `proxy`, and only `middleware` was listed, so a `proxy` file in the shape the framework requires could be flagged. `middleware` stays listed, since it is still valid on the edge runtime and a repo can be on either name.
