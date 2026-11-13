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
- **One colour feeds the paint, and it has no default.** `--<component>-color` is the one colour a component is painted from. The text colour, `--<component>-text-color`, defaults to it, the background colour to it at the 20 step, `color-mix(in oklab, <colour> 20%, transparent)`, and the border colour to it at the 60 step. A product that maps any of the three gets its value in place of the default. With no colour and nothing mapped, the background and the border are transparent and the text colour inherits. An unmapped outline colour follows the text colour, so a focus ring never disappears.
- **A state colour derives from the rest colour.** The background, text and border colour of each state default to the rest value of the same property, the mapped one or the default the one colour feeds, at an alpha step, `color-mix(in oklab, <rest> <step>%, transparent)`, so one colour makes every property and every state respond. The outline colour is not scaled.

| State      | Step                                     |
| ---------- | ---------------------------------------- |
| `hover`    | 80                                       |
| `active`   | 60                                       |
| `pressed`  | 60                                       |
| `disabled` | 40                                       |
| `focus`    | the rest value, and the outline is drawn |

A state variable the product maps wins over the derived value, so a product maps a state only where its palette steps differently on purpose, such as an input border that goes from the 60 step to the 80 step on hover. With no colour and nothing mapped, the background and the border are transparent in every state, and the text colour inherits in every state.

- **The mapping goes in a plain `:root` block, never in `@theme`:**

```css
:root {
  --icon-md-size: calc(var(--spacing) * 24);
  --button-main-color: var(--color-main);
}
```

A custom property resolves its `var()` on the element that declares it, and children inherit the result. So a colour mapped to a token the theme declares again on a toned ground, such as a tone's text colour mapped to `--color-neutral`, goes on the toned root, where the theme declares the neutral of that ground, and never on `:root`, which would hand every tone the neutral of the page:

```css
[data-slot='button'][data-tone='main'] {
  --button-main-background-color: var(--color-main);
  --button-main-text-color: var(--color-neutral);
}
```

Every component takes `asChild` and then renders its child with the same attributes, so a product extends one by wrapping its own element, such as its own `svg` inside an `Icon`.

## Nested radius

Every radius is a step of the ladder: 12, 24 and 40 for a `sm`, `md` and `lg` `Button`, 24 and 40 for a `md` and `lg` `Input`, 12 for a `Badge`. Alone at its own height each control still draws as a pill, since the browser holds a radius to half the height. A container publishes its inner radius, its own radius minus its inline padding and never below zero, and every child reads the inner radius of what holds it before its own default, whatever that default is.

| Component | Reads, in order | Publishes |
| --- | --- | --- |
| `Button` (`text`, `fullWidth`) | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40`: 0, 8, 16 by default |
| `Input` | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40`: 8, 16 by default |
| `Button` (`icon`) | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40`: 12, 24, 40 by default |
| `Button` (`card`) | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40`: 4, 4, 8 by default |
| `Badge` | `--ui-inner-radius-40`, `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | nothing |

So a `Badge` in a medium `Button` draws at 8, 24 minus 16.

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

`type` defaults to `button`. The root carries `data-slot="button"`, `data-kind`, `data-size`, `data-responsive` and `data-content-between`, and on the `text` and `fullWidth` kinds `data-element-edge` (`start`, `end` or both) when the first or the last child of the label is an HTML element, the package's `Badge` or the label's only element when text stands on its other side, and no item sits on that side, since a selector cannot tell whether text stands beside it and another component may render text of its own, and on the `md` size a badge there (any element with `data-slot="badge"`) takes the pull; the items sit in `button-start-item` and `button-end-item` slots, and the card kind puts both in a `button-items` row above the label. An `svg` inside takes the content size unless it sets its own. The package's `Icon` left at its default size takes it too, since the root sets `--icon-md-size` to its content size, as the `Input` and `Badge` roots do; an `Icon` given another `size` keeps that size.

| Variable | Default |
| --- | --- |
| `--button-<size>-height` | 24, 40, 64, a minimum that a wrapped label grows past, and the fixed height of the icon kind; the card kind reads none and takes its height from its padding and content |
| `--button-<size>-px` | 12, 16, 24, two steps below the height and equal to the content size; the items, and on the `md` size a `Badge` at either end of the label, pull toward the edge by half of it; the icon kind has no inline padding, so its items take no pull and the end item is not pushed to the far edge, and the row stays centred in the square |
| `--button-<size>-py` | half of the height less one line and the border width, so one line keeps the height and the text sits 6, 12 or 20 from the outer edge whether the label takes one line or wraps; the icon kind has no padding |
| `--button-line-height` | 1.25, so the lines of a wrapped label keep apart |
| `--button-<size>-content-size` | 12, 16, 24, the font size and the `svg` size |
| `--button-<size>-gap` | 4, 8, 12 |
| `--button-<size>-radius` | `--radius-12`, `--radius-24`, `--radius-40`, a pill at its own height |
| `--button-card-<size>-px`, `--button-card-<size>-py` | 8 by 4, 12 by 8, 16 by 12 |
| `--button-card-<size>-radius` | `--radius-12`, `--radius-16`, `--radius-24` |
| `--button-border-width`, `--button-outline-width`, `--button-outline-offset` | 1, 2, 2 |
| `--button-[<tone>-]color` | none, the one colour the text, background and border derive from |
| `--button-[<tone>-]text-color[--<state>]` | `--button-color` |
| `--button-[<tone>-]background-color[--<state>]` | `--button-color` at the 20 step |
| `--button-[<tone>-]border-color[--<state>]` | `--button-color` at the 60 step |
| `--button-[<tone>-]outline-color[--<state>]` | none |

The states are `hover`, `focus` (drawn on `:focus-visible` as an outline), `active`, `pressed` and `disabled`. `pressed` applies on `aria-pressed="true"`, `aria-selected="true"` or `data-state="active"`, and `disabled` on `disabled` or `aria-disabled="true"`. An outline colour left unmapped for `hover`, `active`, `pressed` or `disabled` falls back to the `focus` one, so a focused selected tab draws its ring in the focus colour. Every state rule has the same specificity, so where two states meet the later one in the order `focus`, `pressed`, `hover`, `active`, `disabled` paints the button: a focused or pressed button still shows hover and active, the ring stays while it is hovered or pressed, and a disabled one shows none of them. On a root with `data-tone`, the tone's variables stand in for the plain ones: `--button-color` reads `--button-<tone>-color`, a property reads `--button-<tone>-<property>` when the product maps it and otherwise its default from that colour, and a state reads `--button-<tone>-<property>--<state>` when the product maps it and otherwise derives from the tone's rest value. So one mapped colour per tone makes every property and every state of the tone respond, and a tone with nothing mapped paints nothing. A colour no tone names goes on one button as `--button-color`, through its `style` or a class.

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

A `label` root with the button's `text` or `fullWidth` proportions, wrapping one `input`. `kind` (`text` or `fullWidth`), `size` (`md` or `lg`, `md` by default), `startItem`, `endItem` and `asChild` go to the root, `className` takes `{ root, input }`, and every other prop, the ref included, goes to the `input`. The root carries `data-slot="input"`, `data-kind` and `data-size`, `data-invalid` when `aria-invalid` is set and `data-disabled` when the input is disabled; the input carries `data-slot="input-control"`. The items render in `aria-hidden` `input-start-item` and `input-end-item` slots inside the label, so they are decoration: a control that acts on the field, such as a clear or a show-password button, goes beside the `Input`, never in `startItem` or `endItem`, where it would be a tab stop with no name.

The `Input` takes its width from what holds it, never from its content: the `input` has a zero width and grows into the root, and the root has a zero minimum width, so the browser's default `size` of 20 characters never sets it. In a grid column it fills the column, and in a flex row it needs a basis or a grow factor, such as `className={{ root: 'col-span-6' }}` or `flex-1`.

The `Input` starts at `md`: a field 24 high with 12 text cannot be typed in or touched in real use, so it has no `sm` size, and passing one is a type error.

| Variable | Default |
| --- | --- |
| `--input-<size>-height`, `-px`, `-content-size`, `-gap`, `-radius` | as the button's `md` and `lg` sizes: 40 and 64 high, 16 and 24 padding and content, 8 and 12 gap, `--radius-24` and `--radius-40` |
| `--input-border-width`, `--input-outline-width`, `--input-outline-offset` | 1, 2, 2 |
| `--input-color` | none, the one colour the text, background and border derive from |
| `--input-text-color[--<state>]` | `--input-color` |
| `--input-background-color[--<state>]` | `--input-color` at the 20 step |
| `--input-border-color[--<state>]` | `--input-color` at the 60 step |
| `--input-outline-color[--<state>]` | none |
| `--input-placeholder-color` | the text colour at the 60 step |

The states are `hover`, `focus` (while the input has visible focus), `invalid` and `disabled`. `hover` moves the border alone, so `--input-border-color--hover` is its one variable, and the typed text, the fill and the focus ring keep their value under the pointer. The `hover` border and the `disabled` colours derive from the rest colour at the steps of the variable grammar unless the product maps them, and `focus` keeps the rest colour. `invalid` takes no step: each property reads its rest value until the product maps that state, so the invalid border reads the rest border until a product maps `--input-border-color--invalid` to its error colour. An outline colour left unmapped for `invalid` or `disabled` falls back to the `focus` one, so a focused invalid field draws its ring in the focus colour. The state rules share one specificity and run `focus`, `hover`, `invalid`, `disabled`, so a focused field still answers hover, and a hovered invalid field takes its invalid border at the hover step, so the error colour stays while it answers.

## Badge

```tsx
import { Badge } from '@soujvnunes/ui'

export const LiveBadge = () => <Badge startItem={<DotIcon />}>Live</Badge>
```

A `span` root with `data-slot="badge"`, 24 high with 12 inline padding and 12 content, and `--radius-12`, a pill at that height. `startItem` sits in an `aria-hidden` `badge-start-item` slot, pulled toward the edge by half the padding, and `asChild` renders the child instead. A badge sits inside a medium `Button` only, since in a small or a large one the optical correction does not hold, and the stylesheet pulls it on the `md` size alone. As the first or the last child of a `text` or `fullWidth` `md` `Button`, with no item on that side, it takes the pull of the button's items, half of `--button-md-px` (8), and a badge between two children takes none. A badge inside a `Button` or an `Input` takes the inner radius it publishes, 8 in a medium `Button`.

| Variable | Default |
| --- | --- |
| `--badge-height`, `--badge-px`, `--badge-content-size`, `--badge-gap` | 24, 12, 12, 4 |
| `--badge-radius` | `--radius-12` |
| `--badge-border-width` | 1 |
| `--badge-color` | none, the one colour the text, background and border derive from |
| `--badge-text-color` | `--badge-color` |
| `--badge-background-color` | `--badge-color` at the 20 step |
| `--badge-border-color` | `--badge-color` at the 60 step |

## Storybook

```bash
pnpm dev                # from the repo root
pnpm storybook          # from ui/
pnpm build-storybook    # the static build, in ui/storybook-static
```

It serves on port 6006, or on the port `PORT` names, and opens no browser tab: open `http://localhost:<port>` by hand, `http://localhost:6006` when `PORT` is unset. It answers component docs to agents at `/mcp` on the same port. Its theme, in `.storybook/theme.css`, is a reference theme with placeholder values, in a light and a dark mode that follow the system setting; it is not part of the npm package.

The Storybook of `main` is published at [main--6af4b1d8205ec2517800544d.chromatic.com](https://main--6af4b1d8205ec2517800544d.chromatic.com), and it serves the component docs to agents at `/mcp` there too. The Chromatic workflow publishes a build on every push, with `chromatic.config.json` as its CLI config.
