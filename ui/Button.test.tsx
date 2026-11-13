import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { BUTTON_KINDS, BUTTON_SIZES, BUTTON_TONES, Button } from './Button'
import { Icon, type IconNode } from './Icon'
const STYLESHEET = readFileSync(`${import.meta.dirname}/styles/button.css`, 'utf8')
const PLUS = <svg viewBox="0 0 24 24" />
const PLUS_NODE: IconNode = [['path', { d: 'M5 12h14M12 5v14', key: 'plus' }]]
const THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--button-main-background-color': 'rgb(1, 2, 3)',
}
const selectorWith = (declaration: string) => {
  const selectors = STYLESHEET.split('}')
    .filter((chunk) => chunk.replace(/\s/g, '').includes(declaration))
    .map((rule) => rule.split('{').at(-2)?.trim())
    .filter(Boolean)
  if (selectors.length === 0) throw new Error(`No rule of the stylesheet holds ${declaration}.`)
  return selectors.join(', ')
}
const selectorReading = (variable: string) => selectorWith(`var(${variable},`)
const TEXT_PADDING = { sm: 12, md: 16, lg: 24 } as const
const CARD_BOX = {
  sm: { px: 8, py: 4, radius: 12 },
  md: { px: 12, py: 8, radius: 16 },
  lg: { px: 16, py: 12, radius: 24 },
} as const
afterEach(cleanup)
describe('Button', () => {
  it('renders a button named by its label, of the text kind and md size by default', () => {
    render(<Button>Place a bid</Button>)
    const button = screen.getByRole('button', { name: 'Place a bid' })
    expect(button.getAttribute('data-slot')).toBe('button')
    expect(button.getAttribute('data-kind')).toBe('text')
    expect(button.getAttribute('data-size')).toBe('md')
  })
  it('defaults its type to button, so a button inside a form does not submit it', () => {
    render(<Button>Cancel</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })
  it('keeps the type it is given', () => {
    render(<Button type="submit">Send</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  })
  it.each(BUTTON_KINDS)(
    'carries the %s kind as its data-kind attribute, for the stylesheet to read',
    (kind) => {
      render(<Button kind={kind}>Label</Button>)
      expect(screen.getByRole('button').getAttribute('data-kind')).toBe(kind)
    },
  )
  it.each(BUTTON_SIZES)(
    'carries the %s size as its data-size attribute, for the stylesheet to read',
    (size) => {
      render(<Button size={size}>Label</Button>)
      expect(screen.getByRole('button').getAttribute('data-size')).toBe(size)
    },
  )
  it.each(BUTTON_TONES)(
    'passes the %s tone through as data-tone, where the stylesheet swaps its colours',
    (tone) => {
      render(<Button data-tone={tone}>Label</Button>)
      expect(screen.getByRole('button').getAttribute('data-tone')).toBe(tone)
    },
  )
  it('takes its size height as a minimum, so a wrapped label grows the button, and fixes it only on the icon kind', () => {
    render(
      <>
        <Button>Label</Button>
        <Button kind="icon" aria-label="Add">
          {PLUS}
        </Button>
      </>,
    )
    const text = screen.getByRole('button', { name: 'Label' })
    const icon = screen.getByRole('button', { name: 'Add' })
    expect(text.matches(selectorWith('{min-height:var(--button-md-height,'))).toBe(true)
    expect(text.matches(selectorWith('{height:var(--button-md-height,'))).toBe(false)
    expect(icon.matches(selectorWith('{height:var(--button-md-height,'))).toBe(true)
  })
  it.each(BUTTON_SIZES)(
    'pads the %s text kind inline two steps below its height, the same number as its content',
    (size) => {
      render(<Button size={size}>Label</Button>)
      const px = `var(--button-${size}-px,calc(var(--spacing)*${TEXT_PADDING[size]}))`
      expect(screen.getByRole('button').matches(selectorWith(`padding-inline:${px};`))).toBe(true)
      expect(STYLESHEET.replace(/\s/g, '')).toContain(
        `font-size:var(--button-${size}-content-size,calc(var(--spacing)*${TEXT_PADDING[size]}));`,
      )
    },
  )
  it.each(BUTTON_SIZES)(
    'draws the %s text kind as a pill that reads no container radius, and publishes a pill inner radius for a Badge',
    (size) => {
      render(<Button size={size}>Label</Button>)
      const button = screen.getByRole('button')
      const px = `var(--button-${size}-px,calc(var(--spacing)*${TEXT_PADDING[size]}))`
      expect(button.matches(selectorWith(`border-radius:var(--button-${size}-radius,9999px);`))).toBe(
        true,
      )
      expect(
        button.matches(
          selectorWith(`--ui-inner-radius-40:max(0px,var(--button-${size}-radius,9999px)-${px});`),
        ),
      ).toBe(true)
      expect(button.matches(selectorReading('--ui-inner-radius-64'))).toBe(false)
    },
  )
  it.each(BUTTON_SIZES)(
    'sizes the %s card kind box from the ladder, and reads the container inner radius before its own',
    (size) => {
      render(
        <Button kind="card" size={size}>
          Lot 12
        </Button>,
      )
      const button = screen.getByRole('button')
      const { px, py, radius } = CARD_BOX[size]
      const inlinePadding = `var(--button-card-${size}-px,calc(var(--spacing)*${px}))`
      const cardRadius = `var(--ui-inner-radius-64,var(--ui-inner-radius-card,var(--button-card-${size}-radius,var(--radius-${radius}))))`
      expect(
        button.matches(
          selectorWith(`padding-block:var(--button-card-${size}-py,calc(var(--spacing)*${py}));`),
        ),
      ).toBe(true)
      expect(button.matches(selectorWith(`padding-inline:${inlinePadding};`))).toBe(true)
      expect(button.matches(selectorWith(`border-radius:${cardRadius};`))).toBe(true)
      expect(
        button.matches(selectorWith(`--ui-inner-radius-40:max(0px,${cardRadius}-${inlinePadding});`)),
      ).toBe(true)
    },
  )
  it('renders the start and end items in their own slots, hidden from assistive technology', () => {
    render(
      <Button startItem={PLUS} endItem="12">
        Add
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Add' })
    const [start, end] = button.children
    expect(start?.getAttribute('data-slot')).toBe('button-start-item')
    expect(start?.getAttribute('aria-hidden')).toBe('true')
    expect(button.childNodes[1]?.textContent).toBe('Add')
    expect(end?.getAttribute('data-slot')).toBe('button-end-item')
    expect(end?.getAttribute('aria-hidden')).toBe('true')
  })
  it.each(BUTTON_SIZES)(
    'hands the %s content size to an Icon left at its default size, so the icon stays two steps below the height',
    (size) => {
      render(
        <Button size={size} startItem={<Icon iconNode={PLUS_NODE} />}>
          Place a bid
        </Button>,
      )
      const button = screen.getByRole('button', { name: 'Place a bid' })
      expect(button.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('md')
      expect(button.matches(selectorWith(`--icon-md-size:var(--button-${size}-content-size,`))).toBe(
        true,
      )
    },
  )
  it('renders no item slot it was not given', () => {
    const { container } = render(<Button>Add</Button>)
    expect(container.querySelector('[data-slot$="-item"]')).toBeNull()
  })
  it.each([false, true, ''])(
    'renders no item slot and no card items row for an item of %j, which React renders as nothing',
    (item) => {
      const { container } = render(
        <Button kind="card" startItem={item} endItem={item}>
          Lot 12
        </Button>,
      )
      expect(container.querySelector('[data-slot$="-item"]')).toBeNull()
      expect(container.querySelector('[data-slot="button-items"]')).toBeNull()
    },
  )
  it('puts the card kind items in one row above the label', () => {
    render(
      <Button kind="card" startItem={PLUS} endItem="New">
        Lot 12
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Lot 12' })
    const row = button.firstElementChild
    expect(row?.getAttribute('data-slot')).toBe('button-items')
    expect([...(row?.children ?? [])].map((item) => item.getAttribute('data-slot'))).toEqual([
      'button-start-item',
      'button-end-item',
    ])
    expect(button.lastChild?.textContent).toBe('Lot 12')
  })
  it('moves a card end item to the far edge of its row, also when it stands alone', () => {
    render(
      <Button kind="card" endItem="New">
        Lot 12
      </Button>,
    )
    const end = screen
      .getByRole('button', { name: 'Lot 12' })
      .querySelector('[data-slot="button-end-item"]')
    expect(end?.parentElement?.getAttribute('data-slot')).toBe('button-items')
    expect(end?.matches(selectorWith('margin-inline-start:auto;'))).toBe(true)
  })
  it('spreads the items apart unless disableContentBetween is set', () => {
    render(
      <>
        <Button endItem="1">Spread</Button>
        <Button endItem="2" disableContentBetween>
          Packed
        </Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Spread' }).getAttribute('data-content-between')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: 'Packed' }).getAttribute('data-content-between')).toBe(
      'false',
    )
  })
  it('pushes the label away from the start item only when an end item follows it', () => {
    render(
      <>
        <Button kind="fullWidth" startItem={PLUS} endItem="12">
          Both
        </Button>
        <Button kind="fullWidth" startItem={PLUS}>
          Start only
        </Button>
      </>,
    )
    const pushed = selectorWith('margin-inline-end:auto;')
    const startOf = (name: string) =>
      screen.getByRole('button', { name }).querySelector('[data-slot="button-start-item"]')
    expect(startOf('Both')?.matches(pushed)).toBe(true)
    expect(startOf('Start only')?.matches(pushed)).toBe(false)
  })
  it('passes className and the remaining button props through to the root', () => {
    render(
      <Button className="col-span-4" name="intent" value="bid" aria-describedby="hint">
        Bid
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button.getAttribute('class')).toBe('col-span-4')
    expect(button.getAttribute('name')).toBe('intent')
    expect(button.getAttribute('value')).toBe('bid')
    expect(button.getAttribute('aria-describedby')).toBe('hint')
  })
  it('hands its ref to the button root', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Bid</Button>)
    expect(ref.current).toBe(screen.getByRole('button'))
  })
  it('carries the disabled state on the root, where the disabled colours apply', () => {
    render(
      <>
        <Button disabled>Native</Button>
        <Button aria-disabled>Announced</Button>
      </>,
    )
    const native = screen.getByRole('button', { name: 'Native' })
    const announced = screen.getByRole('button', { name: 'Announced' })
    expect(native.hasAttribute('disabled')).toBe(true)
    expect(native.matches(selectorReading('--button-background-color--disabled'))).toBe(true)
    expect(announced.matches(selectorReading('--button-background-color--disabled'))).toBe(true)
  })
  it('carries the pressed state on the root, where the pressed colours apply', () => {
    render(<Button aria-pressed>Bold</Button>)
    const button = screen.getByRole('button', { name: 'Bold', pressed: true })
    expect(button.matches(selectorReading('--button-background-color--pressed'))).toBe(true)
  })
  it('falls the pressed and disabled outlines back to the focus colour, so a focused pressed button keeps its ring', () => {
    render(
      <>
        <Button aria-pressed>Bold</Button>
        <Button aria-disabled>Announced</Button>
      </>,
    )
    const pressed = screen.getByRole('button', { name: 'Bold', pressed: true })
    const disabled = screen.getByRole('button', { name: 'Announced' })
    expect(
      pressed.matches(
        selectorWith(
          'outline-color:var(--button-outline-color--pressed,var(--button-outline-color--focus,',
        ),
      ),
    ).toBe(true)
    expect(
      disabled.matches(
        selectorWith(
          'outline-color:var(--button-outline-color--disabled,var(--button-outline-color--focus,',
        ),
      ),
    ).toBe(true)
  })
  it('applies the hover colours only where the pointer can hover, so a tap leaves no stuck hover', () => {
    expect(STYLESHEET.replace(/\s/g, '')).toContain(
      "@media(hover:hover){[data-slot='button']:where(:not([data-responsive='false'],:disabled,[aria-disabled='true']):hover)",
    )
  })
  it('carries data-state when stateful, active while pressed and inactive otherwise', () => {
    render(
      <>
        <Button stateful aria-pressed>
          On
        </Button>
        <Button stateful aria-pressed={false}>
          Off
        </Button>
        <Button>Plain</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'On' }).getAttribute('data-state')).toBe('active')
    expect(screen.getByRole('button', { name: 'Off' }).getAttribute('data-state')).toBe('inactive')
    expect(screen.getByRole('button', { name: 'Plain' }).hasAttribute('data-state')).toBe(false)
  })
  it('turns off the pressed look when it is not responsive', () => {
    render(
      <Button responsive={false} aria-pressed>
        Static
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Static' })
    expect(button.getAttribute('data-responsive')).toBe('false')
    expect(button.matches(selectorReading('--button-background-color--pressed'))).toBe(false)
  })
  it('leaves the tab order when it is not responsive, since it draws no focus outline', () => {
    render(
      <>
        <Button responsive={false}>Static</Button>
        <Button>Live</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Static' }).tabIndex).toBe(-1)
    expect(screen.getByRole('button', { name: 'Live' }).hasAttribute('tabindex')).toBe(false)
  })
  it('renders the child element with asChild, carrying the attributes and the items', () => {
    render(
      <Button asChild size="lg" startItem={PLUS} className="button">
        <a href="/lots/12" className="lot">
          Lot 12
        </a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Lot 12' })
    expect(link.getAttribute('data-slot')).toBe('button')
    expect(link.getAttribute('data-size')).toBe('lg')
    expect(link.hasAttribute('type')).toBe(false)
    expect(link.getAttribute('class')?.split(' ').sort()).toEqual(['button', 'lot'])
    expect(link.firstElementChild?.getAttribute('data-slot')).toBe('button-start-item')
  })
  it('keeps the role and selection of a tab it wraps with asChild, and shows the selected tab as pressed', () => {
    render(
      <div role="tablist" aria-label="Lot">
        <Button asChild>
          <button type="button" role="tab" aria-selected>
            Bids
          </button>
        </Button>
        <Button asChild>
          <button type="button" role="tab" aria-selected={false}>
            History
          </button>
        </Button>
      </div>,
    )
    const selected = screen.getByRole('tab', { name: 'Bids', selected: true })
    const other = screen.getByRole('tab', { name: 'History', selected: false })
    expect(selected.getAttribute('data-slot')).toBe('button')
    expect(selected.matches(selectorReading('--button-background-color--pressed'))).toBe(true)
    expect(other.matches(selectorReading('--button-background-color--pressed'))).toBe(false)
  })
  it('reads the selection of the tab it wraps with asChild when stateful, so a selected tab is active', () => {
    render(
      <div role="tablist" aria-label="Lot">
        <Button asChild stateful>
          <button type="button" role="tab" aria-selected>
            Bids
          </button>
        </Button>
        <Button asChild stateful>
          <button type="button" role="tab" aria-selected={false}>
            History
          </button>
        </Button>
      </div>,
    )
    expect(screen.getByRole('tab', { name: 'Bids', selected: true }).getAttribute('data-state')).toBe(
      'active',
    )
    expect(
      screen.getByRole('tab', { name: 'History', selected: false }).getAttribute('data-state'),
    ).toBe('inactive')
  })
  it('leaves data-state to a wrapped tab that sets its own selection, so a selected tab stays active', () => {
    const Trigger = (props: React.ComponentProps<'button'>) => (
      <button type="button" role="tab" aria-selected data-state="active" {...props} />
    )
    render(
      <div role="tablist" aria-label="Lot">
        <Button asChild stateful>
          <Trigger>Bids</Trigger>
        </Button>
      </div>,
    )
    expect(screen.getByRole('tab', { name: 'Bids', selected: true }).getAttribute('data-state')).toBe(
      'active',
    )
  })
  it('reads a variable a wrapper sets, the way a theme maps the button', () => {
    render(
      <div style={THEME}>
        <Button data-tone="main">Bid</Button>
      </div>,
    )
    expect(
      getComputedStyle(screen.getByRole('button')).getPropertyValue('--button-main-background-color'),
    ).toBe('rgb(1, 2, 3)')
  })
})
