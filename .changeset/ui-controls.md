---
'@soujvnunes/ui': minor
---

Add the `Button`, `Input` and `Badge` skeletons, each with its stylesheet in `@soujvnunes/ui/styles.css` and its own subpath. Each pads inline two steps below its height: 12, 16 and 24 for a 24, 40 and 64 `Button` or `Input`, with `--radius-12`, `--radius-24` and `--radius-40`, and 12 with `--radius-12` for the 24 high `Badge`. The card kind of the `Button` pads 8 by 4, 12 by 8 and 16 by 12 with `--radius-12`, `--radius-16` and `--radius-24`. Every control reads the inner radius of a field or a card around it before its own, a `Button` or an `Input` publishes `--ui-inner-radius-40`, its radius less its padding, for a `Badge` inside it. A product maps the rest paint of each colour, and the hover, active, pressed and disabled states of the `Button`, and the hover and disabled states of the `Input`, derive from it at an alpha step unless the product maps that state. The package now declares itself free of side effects apart from its CSS.
