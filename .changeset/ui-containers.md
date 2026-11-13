---
'@soujvnunes/ui': minor
---

Add the `Bar`, `Field`, `ButtonGroup` and `Card` skeletons, with `CardTitle` and `CardDescription`, each with its stylesheet in `@soujvnunes/ui/styles.css` and its own subpath. A container publishes its inner radius for what it holds: `--ui-inner-radius-64` from a bar, a field or a button group, and `--ui-inner-radius-card` from a card. A button group squares the inner sides of the buttons and inputs it joins, and a `Badge` takes `data-corner` to sit on a corner of its parent and share its radius there.
