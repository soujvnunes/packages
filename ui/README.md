# @soujvnunes/ui

Unstyled React component skeletons: markup, props, accessibility and one stylesheet per component, with no colour of their own. A product themes them by mapping each component's CSS custom properties to its own tokens.

## Install

```bash
pnpm add @soujvnunes/ui react
```

```tsx
import { Icon } from '@soujvnunes/ui'
```

Each component is also its own subpath, which resolves to the same module, so pick one style per codebase:

```tsx
import { Icon } from '@soujvnunes/ui/Icon'
```

## Stylesheet

Import the stylesheet once, in the CSS entry that holds the theme:

```css
@import 'tailwindcss';
@import '@soujvnunes/ui/styles.css';
```

Every declaration sits in `@layer components`, so a utility class passed as `className` wins over it by layer order. Without the import, a component still renders its markup and attributes, unstyled.

## Variable grammar

A component's root carries `data-slot="<name>"` and one `data-<axis>` attribute per variant, and the stylesheet selects on those attributes. Every value it sets reads one variable:

```text
--<component>-[<variant value>-]<property>[--<state>]
```

| Variable                            | Reads as                                                     |
| ----------------------------------- | ------------------------------------------------------------ |
| `--icon-md-size`                    | the `md` size of an icon, its width and height               |
| `--button-lg-height`                | the `lg` size of a button, its height                        |
| `--button-main-border-color--hover` | the `main` tone of a button, its border colour while hovered |

- **Structural values default to the ladder.** Size, padding, gap and radius read `calc(var(--spacing) * <number>)` and `var(--radius-<number>)`, so a theme that declares a one-pixel `--spacing` and the radius steps maps nothing to get them.
- **Paint values have no default.** A background or border colour no theme maps is transparent, and an unmapped text colour inherits. An unmapped outline colour follows the text colour, so a focus ring never disappears.
- **A state falls back to the plain value.** `--button-background-color--hover` unmapped reads `--button-background-color`.
- **The mapping goes in a plain `:root` block, never in `@theme`:**

```css
:root {
  --icon-md-size: calc(var(--spacing) * 24);
}
```

A custom property resolves its `var()` on the element that declares it, and children inherit the result. So a tone's text colour mapped to `--color-neutral` goes on the toned root, where the theme declares the neutral of that ground, and never on `:root`, which would hand every tone the neutral of the page:

```css
[data-slot='button'][data-tone] {
  --button-main-color: var(--color-neutral);
}
```

Every component takes `asChild` and then renders its child with the same attributes, so a product extends one by wrapping its own element, such as its own `svg` inside an `Icon`.

## Nested radius

A control is a pill by default (`9999px`), and a pill reads no container radius, since a full radius stays parallel to any padding. A container publishes its inner radius, its own radius minus its inline padding and never below zero, and only a child with a numeric radius reads it before its own default: the card kind of the `Button`, and a `Badge` whose `--badge-radius` the product maps.

| Component | Reads, in order | Publishes |
| --- | --- | --- |
| `Button` (`text`, `icon`, `fullWidth`), `Input` | its own radius, a pill by default | `--ui-inner-radius-40`, a pill while the radius is one |
| `Button` (`card`) | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40`: 4, 4, 8 by default |
| `Badge` | `--ui-inner-radius-40` once `--badge-radius` is mapped, then `--badge-radius`; a pill while it is unmapped | nothing |

The badge computes an internal `--ui-badge-radius` that multiplies `--badge-radius` by zero before it adds the inner radius, so with `--badge-radius` unset the property is invalid and the border radius falls back to the pill.

## Button

```tsx
import { Button } from '@soujvnunes/ui'

export const PlaceBid = () => (
  <Button data-tone="main" startItem={<PlusIcon />}>
    Place a bid
  </Button>
)
```

| Prop | Values | Default |
| --- | --- | --- |
| `kind` | `text`, `icon`, `fullWidth`, `card` | `text` |
| `size` | `sm`, `md`, `lg` | `md` |
| `data-tone` | `main`, `accent`, `success`, `warning`, `error` | none |
| `startItem`, `endItem` | any node, rendered in an `aria-hidden` span; a node React renders as nothing (`false`, `true`, `null`, `undefined` or `''`) adds no span, so `startItem={isNew && <Badge />}` is safe | none |
| `disableContentBetween` | keeps the start item beside the label and moves the end item alone to the far edge | `false` |
| `stateful` | sets `data-state` to `active` while `aria-pressed` or `aria-selected` is true, `inactive` otherwise; with `asChild`, only when the child's props declare one of the two, so a child that sets its own selection keeps its own `data-state` | `false` |
| `responsive` | `false` drops the hover, focus, active and pressed styles, makes the text unselectable and sets `tabIndex` to -1, so the element leaves the tab order; a `tabIndex` prop overrides it | `true` |
| `asChild` | renders its one child with the button's attributes | `false` |

`type` defaults to `button`. The root carries `data-slot="button"`, `data-kind`, `data-size`, `data-responsive` and `data-content-between`, and on the `text` and `fullWidth` kinds `data-element-edge` (`start`, `end` or both) when an element rather than text is the first or the last child of the label and no item sits on that side, since a selector cannot tell whether text stands beside it, and on the `md` size a badge there (any element with `data-slot="badge"`) takes the pull; the items sit in `button-start-item` and `button-end-item` slots, and the card kind puts both in a `button-items` row above the label. An `svg` inside takes the content size unless it sets its own. The package's `Icon` left at its default size takes it too, since the root sets `--icon-md-size` to its content size, as the `Input` and `Badge` roots do; an `Icon` given another `size` keeps that size.

| Variable | Default |
| --- | --- |
| `--button-<size>-height` | 24, 40, 64, a minimum that a wrapped label grows past, and the fixed height of the icon kind; the card kind reads none and takes its height from its padding and content |
| `--button-<size>-px` | 12, 16, 24, two steps below the height and equal to the content size; the items, and on the `md` size a `Badge` at either end of the label, pull toward the edge by half of it |
| `--button-<size>-content-size` | 12, 16, 24, the font size and the `svg` size |
| `--button-<size>-gap` | 4, 8, 12 |
| `--button-<size>-radius` | `9999px`, a pill at every size |
| `--button-card-<size>-px`, `--button-card-<size>-py` | 8 by 4, 12 by 8, 16 by 12 |
| `--button-card-<size>-radius` | `--radius-12`, `--radius-16`, `--radius-24` |
| `--button-border-width`, `--button-outline-width`, `--button-outline-offset` | 1, 2, 2 |
| `--button-[<tone>-]background-color[--<state>]` | none |
| `--button-[<tone>-]color[--<state>]` | none |
| `--button-[<tone>-]border-color[--<state>]` | none |
| `--button-[<tone>-]outline-color[--<state>]` | none |

The states are `hover`, `focus` (drawn on `:focus-visible` as an outline), `active`, `pressed` and `disabled`. `pressed` applies on `aria-pressed="true"`, `aria-selected="true"` or `data-state="active"`, and `disabled` on `disabled` or `aria-disabled="true"`. An outline colour left unmapped for `active`, `pressed` or `disabled` falls back to the `focus` one, so a focused selected tab draws its ring in the focus colour. On a root with `data-tone`, the tone's variables stand in for the plain ones, so an unmapped tone is transparent.

A product builds a tab from the button with its own tabs primitive, and the selected tab shows as pressed:

```tsx
<Button asChild>
  <TabsTrigger value="bids">Bids</TabsTrigger>
</Button>
```

## Input

```tsx
import { Input } from '@soujvnunes/ui'

export const PlateField = () => (
  <Input aria-label="Plate" startItem={<SearchIcon />} className={{ root: 'col-span-6' }} />
)
```

A `label` root with the button's `text` or `fullWidth` proportions, wrapping one `input`. `kind` (`text` or `fullWidth`), `size`, `startItem`, `endItem` and `asChild` go to the root, `className` takes `{ root, input }`, and every other prop, the ref included, goes to the `input`. The root carries `data-slot="input"`, `data-kind` and `data-size`, `data-invalid` when `aria-invalid` is set and `data-disabled` when the input is disabled; the input carries `data-slot="input-control"`. The items render in `aria-hidden` `input-start-item` and `input-end-item` slots inside the label, so they are decoration: a control that acts on the field, such as a clear or a show-password button, goes beside the `Input`, never in `startItem` or `endItem`, where it would be a tab stop with no name.

| Variable                                                                  | Default               |
| ------------------------------------------------------------------------- | --------------------- |
| `--input-<size>-height`, `-px`, `-content-size`, `-gap`, `-radius`        | as the button's sizes |
| `--input-border-width`, `--input-outline-width`, `--input-outline-offset` | 1, 2, 2               |
| `--input-background-color[--<state>]`                                     | none                  |
| `--input-color[--<state>]`                                                | none                  |
| `--input-border-color[--<state>]`                                         | none                  |
| `--input-outline-color[--<state>]`                                        | none                  |
| `--input-placeholder-color`                                               | the text colour       |

The states are `hover`, `focus` (while the input has visible focus), `invalid` and `disabled`. An outline colour left unmapped for `invalid` or `disabled` falls back to the `focus` one, so a focused invalid field draws its ring in the focus colour.

## Badge

```tsx
import { Badge } from '@soujvnunes/ui'

export const LiveBadge = () => <Badge startItem={<DotIcon />}>Live</Badge>
```

A `span` root with `data-slot="badge"`, 24 high with 12 inline padding and 12 content, a pill by default. `startItem` sits in an `aria-hidden` `badge-start-item` slot, pulled toward the edge by half the padding, and `asChild` renders the child instead. A badge sits inside a medium `Button` only, since in a small or a large one the optical correction does not hold, and the stylesheet pulls it on the `md` size alone. As the first or the last child of a `text` or `fullWidth` `md` `Button`, with no item on that side, it takes the pull of the button's items, half of `--button-md-px` (8), and a badge between two children takes none. A badge inside a pill `Button` or an `Input` is a pill, and a badge inside a card-kind `Button` reads the inner radius that kind publishes once the product maps a numeric `--badge-radius`.

| Variable                                                              | Default       |
| --------------------------------------------------------------------- | ------------- |
| `--badge-height`, `--badge-px`, `--badge-content-size`, `--badge-gap` | 24, 12, 12, 4 |
| `--badge-radius`                                                      | none, a pill  |
| `--badge-border-width`                                                | 1             |
| `--badge-background-color`, `--badge-color`, `--badge-border-color`   | none          |

## Storybook

```bash
pnpm dev                # from the repo root
pnpm storybook          # from ui/
pnpm build-storybook    # the static build, in ui/storybook-static
```

It serves on port 6006, or on the port `PORT` names, and opens no browser tab: open `http://localhost:<port>` by hand, `http://localhost:6006` when `PORT` is unset. It answers component docs to agents at `/mcp` on the same port. Its theme, in `.storybook/theme.css`, is a reference theme with placeholder values, in a light and a dark mode that follow the system setting; it is not part of the npm package.

The Storybook of `main` is published at [main--6af4b1d8205ec2517800544d.chromatic.com](https://main--6af4b1d8205ec2517800544d.chromatic.com), and it serves the component docs to agents at `/mcp` there too. The Chromatic workflow publishes a build on every push, with `chromatic.config.json` as its CLI config.
