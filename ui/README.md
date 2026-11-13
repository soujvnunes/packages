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

Every component takes `asChild` and then renders its child with the same attributes, so a product extends one by wrapping its own element, such as its own `svg` inside an `Icon`.

## Nested radius

A container publishes its inner radius, its own radius minus its padding and never below zero, and a child reads it before its own default, so nested curves stay parallel. A full radius stays a pill.

| Component | Reads, in order | Publishes |
| --- | --- | --- |
| `Button`, `Input` | `--ui-inner-radius-64`, `--ui-inner-radius-card`, its own radius | `--ui-inner-radius-40` |
| `Badge` | `--ui-inner-radius-40`, its own radius | nothing |

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
| `stateful` | sets `data-state` to `active` while `aria-pressed` or `aria-selected` is true, `inactive` otherwise | `false` |
| `responsive` | `false` drops the hover, focus, active and pressed styles and makes the text unselectable; the element stays a `button`, so wrap a `span` with `asChild` when it must not take focus | `true` |
| `asChild` | renders its one child with the button's attributes | `false` |

`type` defaults to `button`. The root carries `data-slot="button"`, `data-kind`, `data-size`, `data-responsive` and `data-content-between`; the items sit in `button-start-item` and `button-end-item` slots, and the card kind puts both in a `button-items` row above the label. An `svg` inside takes the content size unless it sets its own.

| Variable | Default |
| --- | --- |
| `--button-<size>-height` | 24, 40, 64 |
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

The states are `hover`, `focus` (drawn on `:focus-visible` as an outline), `active`, `pressed` and `disabled`. `pressed` applies on `aria-pressed="true"`, `aria-selected="true"` or `data-state="active"`, and `disabled` on `disabled` or `aria-disabled="true"`. On a root with `data-tone`, the tone's variables stand in for the plain ones, so an unmapped tone is transparent.

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

The states are `hover`, `focus` (while the input has visible focus), `invalid` and `disabled`.

## Badge

```tsx
import { Badge } from '@soujvnunes/ui'

export const LiveBadge = () => <Badge startItem={<DotIcon />}>Live</Badge>
```

A `span` root with `data-slot="badge"`, 24 high with 16 inline padding and 12 content. `startItem` sits in an `aria-hidden` `badge-start-item` slot, and `asChild` renders the child instead. Inside a `Button` or an `Input` it takes their inner radius.

| Variable                                                              | Default       |
| --------------------------------------------------------------------- | ------------- |
| `--badge-height`, `--badge-px`, `--badge-content-size`, `--badge-gap` | 24, 16, 12, 4 |
| `--badge-radius`                                                      | `--radius-8`  |
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
