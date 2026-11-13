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

A container publishes its inner radius, its own radius minus its padding and never below zero, in a custom property named by its level, and a child reads it before its own default, so nested curves stay parallel. Each level has a name of its own, since a property that reads itself on the element that sets it is invalid.

| Component | Reads, in order | Publishes |
| --- | --- | --- |
| `Bar`, `Field`, `ButtonGroup` | `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-64`, and clears `--ui-inner-radius-card` for what it holds |
| `Card` | its own radius | `--ui-inner-radius-card`, and clears `--ui-inner-radius-64` for what it holds |
| `Button`, `Input` | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40` |
| `Badge` | `--ui-inner-radius-40`, its own radius | nothing |

A container subtracts its block padding, so the default bar of radius 24 with 12 of padding gives its controls 12, and the default card of radius 24 with 16 gives 8. Three cases follow:

- **Within.** A control nested in a container takes the container's inner radius, such as a button in a bar or a card, or a badge in a button.
- **Close.** A control attached to its container's edge shares the container's own radius on the side it touches. A `ButtonGroup` has no padding, so its inner radius is its own: its first and last controls keep it on their outer side, and every inner side is square. A `Badge` with `data-corner` sits on that corner of its parent and inherits the parent's radius there.
- **Outside.** A sibling keeps the default radius of its own height.

A full radius stays a pill: a container whose radius variable is `calc(infinity * 1px)` publishes an infinite inner radius, so what it holds is a pill too. A `rounded-full` class rounds the element it sits on and publishes nothing. Two containers of one level do not chain: a `ButtonGroup` inside a `Bar` starts from its own radius, since both publish `--ui-inner-radius-64`.

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
| `startItem`, `endItem` | any node, rendered in an `aria-hidden` span | none |
| `disableContentBetween` | keeps the start item beside the label and moves the end item alone to the far edge | `false` |
| `stateful` | sets `data-state` to `active` while `aria-pressed` or `aria-selected` is true, `inactive` otherwise; with `asChild`, only when the child's props declare one of the two, so a child that sets its own selection keeps its own `data-state` | `false` |
| `responsive` | `false` drops the hover, focus, active and pressed styles, makes the text unselectable and sets `tabIndex` to -1, so the element leaves the tab order; a `tabIndex` prop overrides it | `true` |
| `asChild` | renders its one child with the button's attributes | `false` |

`type` defaults to `button`. The root carries `data-slot="button"`, `data-kind`, `data-size`, `data-responsive` and `data-content-between`; the items sit in `button-start-item` and `button-end-item` slots, and the card kind puts both in a `button-items` row above the label. An `svg` inside takes the content size unless it sets its own. The package's `Icon` left at its default size takes it too, since the root sets `--icon-md-size` to its content size, as the `Input` and `Badge` roots do; an `Icon` given another `size` keeps that size.

| Variable | Default |
| --- | --- |
| `--button-<size>-height` | 24, 40, 64, a minimum that a wrapped label grows past, and the fixed height of the icon kind |
| `--button-<size>-px` | 16, 24, 40 |
| `--button-<size>-content-size` | 12, 16, 24, the font size and the `svg` size |
| `--button-<size>-gap` | 4, 8, 12 |
| `--button-<size>-radius` | `--radius-8`, `--radius-12`, `--radius-16` |
| `--button-card-px`, `--button-card-py` | 24, 16 |
| `--button-card-radius` | one step below the text kind: `--radius-4`, `--radius-8`, `--radius-12` |
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

A `label` root with the button's `text` or `fullWidth` proportions, wrapping one `input`. `kind` (`text` or `fullWidth`), `size`, `startItem`, `endItem` and `asChild` go to the root, `className` takes `{ root, input }`, and every other prop, the ref included, goes to the `input`. The root carries `data-slot="input"`, `data-kind` and `data-size`, `data-invalid` when `aria-invalid` is set and `data-disabled` when the input is disabled; the input carries `data-slot="input-control"`.

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

A `span` root with `data-slot="badge"`, 24 high with 16 inline padding and 12 content. `startItem` sits in an `aria-hidden` `badge-start-item` slot, and `asChild` renders the child instead. Inside a `Button` or an `Input` it takes their inner radius. `data-corner` (`top-start`, `top-end`, `bottom-start` or `bottom-end`, listed in `BADGE_CORNERS`) lifts it onto that corner of its parent, which it positions, and that corner alone inherits the parent's radius:

```tsx
<Button kind="card" startItem="Lot 12">
  Volkswagen Fusca 1973
  <Badge data-corner="top-end">New</Badge>
</Button>
```

| Variable                                                              | Default       |
| --------------------------------------------------------------------- | ------------- |
| `--badge-height`, `--badge-px`, `--badge-content-size`, `--badge-gap` | 24, 16, 12, 4 |
| `--badge-radius`                                                      | `--radius-8`  |
| `--badge-border-width`                                                | 1             |
| `--badge-background-color`, `--badge-color`, `--badge-border-color`   | none          |

## Bar

```tsx
import { Bar, Button } from '@soujvnunes/ui'

export const LotHeader = () => (
  <Bar asChild>
    <header>
      <strong>Lot 12</strong>
      <Button>Watch</Button>
    </header>
  </Bar>
)
```

A `div` row with `data-slot="bar"`, at least 64 high, holding controls of 40 inside 12 of block padding and 40 of inline padding. Text and an `svg` directly inside take the content size. `asChild` renders the child instead, so a product makes it its `header`, its `nav` or a toolbar, which keeps its own role.

| Variable | Default |
| --- | --- |
| `--bar-height` | 64, a minimum |
| `--bar-py`, `--bar-px` | 12, 40 |
| `--bar-gap` | 16 |
| `--bar-content-size` | 24, the font size and the `svg` size |
| `--bar-radius` | `--radius-24` |
| `--bar-border-width` | 0, so a control of 40 keeps the bar at 64 |
| `--bar-background-color`, `--bar-color`, `--bar-border-color` | none |

## Field

```tsx
import { Field, Input } from '@soujvnunes/ui'

export const MaxBid = ({ error }: { error?: string }) => (
  <Field label="Max bid" hint="At least R$ 51.000" error={error}>
    <Input kind="fullWidth" />
  </Field>
)
```

A 64 bar for one control: its `label` above, `startItem` and `endItem` beside it, and its `hint` below, or its `error` in place of the hint while one is set. The control is the one child, and it grows into the room the items leave. With `asChild` the child element becomes the root and the control is its one child.

The Field uses no context, so a server component renders it. Its ids come from `useId` and reach the control as props: an `id` for the label's `htmlFor` (a control that has its own keeps it), the hint or the error added to the `aria-describedby` the control already carries, and `aria-invalid` while an error shows. An empty or `false` error counts as none, and an `Input` shows its own invalid state from the `aria-invalid` it receives. The root carries `data-slot="field"`, and `data-invalid` while an error shows; the parts carry `field-label`, `field-start-item`, `field-end-item`, `field-hint` and `field-error`. The items are not hidden from assistive technology, since an item can be a control such as a `Button`. The label and the hint have no typography of their own.

| Variable | Default |
| --- | --- |
| `--field-height` | 64, a minimum |
| `--field-py`, `--field-px` | 12, 12 |
| `--field-gap` | 8 |
| `--field-radius` | `--radius-24` |
| `--field-border-width` | 0 |
| `--field-background-color[--invalid]`, `--field-color[--invalid]`, `--field-border-color[--invalid]` | none |
| `--field-hint-color`, `--field-error-color` | the text colour |

## ButtonGroup

```tsx
import { Button, ButtonGroup } from '@soujvnunes/ui'

export const Period = () => (
  <ButtonGroup aria-label="Period">
    <Button>Day</Button>
    <Button>Week</Button>
    <Button>Month</Button>
  </ButtonGroup>
)
```

Joined controls that share one outer radius: a `div` with `role="group"`, `data-slot="button-group"` and `data-orientation`, `horizontal` by default or `vertical`, with no gap and no padding. A `Button` or an `Input` directly inside keeps the group radius on its outer side and is square on every inner side. With `asChild` the group passes no role of its own, so its child keeps the one it has.

| Variable                | Default                                               |
| ----------------------- | ----------------------------------------------------- |
| `--button-group-radius` | `--radius-12`, the radius of the 40 controls it joins |

A tab list is a `ButtonGroup` and each tab a `Button`, both wrapped around a product's own tabs primitive, so the package ships no Tabs. The list keeps its `tablist` role and each trigger its `tab` role, and the selected tab shows as pressed:

```tsx
<ButtonGroup asChild>
  <TabsList>
    <Button asChild>
      <TabsTrigger value="bids">Bids</TabsTrigger>
    </Button>
    <Button asChild>
      <TabsTrigger value="history">History</TabsTrigger>
    </Button>
  </TabsList>
</ButtonGroup>
```

## Card

```tsx
import { Badge, Button, Card, CardDescription, CardTitle } from '@soujvnunes/ui'

export const LotCard = () => (
  <Card>
    <Badge>New</Badge>
    <CardTitle asChild>
      <h2>Volkswagen Fusca 1973</h2>
    </CardTitle>
    <CardDescription>Lot 12, open until 20h</CardDescription>
    <Button data-tone="main">Place a bid</Button>
  </Card>
)
```

An `article` with `data-slot="card"`, padding and radius only, the static form of a `Button` of the `card` kind. It points `aria-labelledby` and `aria-describedby` at the `CardTitle` and the `CardDescription` inside it, wherever a product places them, around or inside its own markup. Each part is a `div` with `data-slot="card-title"` or `data-slot="card-description"`, no typography of its own and the id its card gives it. A Card needs both, so outside production it logs one error naming the part it is missing. The rest of a card, an action or a footer, is the product's own markup.

The ids travel through a context, so `Card`, `CardTitle` and `CardDescription` are client components, the only ones in the package, and what a server parent passes them as children stays server-rendered. Each takes `asChild`.

| Variable                                                         | Default       |
| ---------------------------------------------------------------- | ------------- |
| `--card-py`, `--card-px`                                         | 16, 24        |
| `--card-radius`                                                  | `--radius-24` |
| `--card-border-width`                                            | 1             |
| `--card-background-color`, `--card-color`, `--card-border-color` | none          |

## Storybook

```bash
pnpm dev                # from the repo root
pnpm storybook          # from ui/
pnpm build-storybook    # the static build, in ui/storybook-static
```

It serves on port 6006, or on the port `PORT` names, and opens no browser tab: open `http://localhost:<port>` by hand, `http://localhost:6006` when `PORT` is unset. It answers component docs to agents at `/mcp` on the same port. Its theme, in `.storybook/theme.css`, is a reference theme with placeholder values, in a light and a dark mode that follow the system setting; it is not part of the npm package.

The Storybook of `main` is published at [main--6af4b1d8205ec2517800544d.chromatic.com](https://main--6af4b1d8205ec2517800544d.chromatic.com), and it serves the component docs to agents at `/mcp` there too. The Chromatic workflow publishes a build on every push, with `chromatic.config.json` as its CLI config.
