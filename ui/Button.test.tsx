import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { BUTTON_KINDS, BUTTON_SIZES, BUTTON_TONES, Button } from './Button'
const STYLESHEET = readFileSync(`${import.meta.dirname}/styles/button.css`, 'utf8')
const PLUS = <svg viewBox="0 0 24 24" />
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
  it('renders no item slot it was not given', () => {
    const { container } = render(<Button>Add</Button>)
    expect(container.querySelector('[data-slot$="-item"]')).toBeNull()
  })
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
