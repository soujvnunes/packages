---
'@soujvnunes/ui': minor
---

Add the `Button`, `Input` and `Badge` skeletons, each with its stylesheet in `@soujvnunes/ui/styles.css` and its own subpath. Each is a pill by default and pads inline two steps below its height: 12, 16 and 24 for a 24, 40 and 64 `Button` or `Input`, and 12 for the 24 high `Badge`. The card kind of the `Button` pads 8 by 4, 12 by 8 and 16 by 12 with `--radius-12`, `--radius-16` and `--radius-24`. A `Button` or an `Input` publishes `--ui-inner-radius-40` for a `Badge` inside it, which stays a pill unless the product maps a numeric `--badge-radius`, and the package now declares itself free of side effects apart from its CSS.
