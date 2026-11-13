import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { Icon, type IconNode } from './Icon'
const STYLESHEET = readFileSync(`${import.meta.dirname}/styles/badge.css`, 'utf8').replace(/\s/g, '')
const DOT = <svg viewBox="0 0 8 8" />
const DOT_NODE: IconNode = [['circle', { cx: '12', cy: '12', r: '8', key: 'dot' }]]
const selectorWith = (declaration: string) => {
  const selector = STYLESHEET.split('}')
    .find((chunk) => chunk.includes(declaration))
    ?.split('{')
    .at(-2)
  if (!selector) throw new Error(`No rule of the stylesheet holds ${declaration}.`)
  return selector
}
const THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--badge-background-color': 'rgb(1, 2, 3)',
}
const rootOf = (container: HTMLElement) => {
  const root = container.querySelector('[data-slot="badge"]')
  if (!root) throw new Error('The badge root is missing.')
  return root
}
afterEach(cleanup)
describe('Badge', () => {
  it('renders its label in a span root that carries the badge slot', () => {
    const { container } = render(<Badge>New</Badge>)
    const root = rootOf(container)
    expect(root.tagName).toBe('SPAN')
    expect(root.textContent).toBe('New')
  })
  it('renders the start item before the label, in its own slot hidden from assistive technology', () => {
    const { container } = render(<Badge startItem={DOT}>Live</Badge>)
    const item = rootOf(container).firstElementChild
    expect(item?.getAttribute('data-slot')).toBe('badge-start-item')
    expect(item?.getAttribute('aria-hidden')).toBe('true')
    expect(item?.querySelector('svg')).not.toBeNull()
  })
  it('hands its content size to an Icon left at its default size, so the icon stays two steps below the height', () => {
    const { container } = render(<Badge startItem={<Icon iconNode={DOT_NODE} />}>Live</Badge>)
    const root = rootOf(container)
    expect(root.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('md')
    expect(root.matches(selectorWith('--icon-md-size:var(--badge-content-size,'))).toBe(true)
  })
  it('pads inline 12, two steps below its height, and pulls the start item by half of it', () => {
    const { container } = render(<Badge startItem={DOT}>Live</Badge>)
    const root = rootOf(container)
    expect(root.matches(selectorWith('padding-inline:var(--badge-px,calc(var(--spacing)*12));'))).toBe(
      true,
    )
    expect(
      root.firstElementChild?.matches(
        selectorWith('margin-inline-start:calc(var(--badge-px,calc(var(--spacing)*12))/-2);'),
      ),
    ).toBe(true)
  })
  it('takes the inner radius of a Button or an Input around it, then of a field or a card, before its own --radius-12', () => {
    const { container } = render(<Badge>New</Badge>)
    const root = rootOf(container)
    expect(
      root.matches(
        selectorWith(
          'border-radius:var(--ui-inner-radius-40,var(--ui-inner-radius-64,var(--ui-inner-radius-card,var(--badge-radius,var(--radius-12)))));',
        ),
      ),
    ).toBe(true)
  })
  it('paints the text from the one colour --badge-color, the background at its 20 step and the border at its 60 step, unless the theme maps each', () => {
    expect(STYLESHEET).toContain(
      'background-color:var(--badge-background-color,color-mix(inoklab,var(--badge-color,transparent)20%,transparent));',
    )
    expect(STYLESHEET).toContain('color:var(--badge-text-color,var(--badge-color));')
    expect(STYLESHEET).toContain(
      'border-color:var(--badge-border-color,color-mix(inoklab,var(--badge-color,transparent)60%,transparent));',
    )
  })
  it('renders no start item slot when it has none, so the label sits alone', () => {
    const { container } = render(<Badge>New</Badge>)
    expect(container.querySelector('[data-slot="badge-start-item"]')).toBeNull()
  })
  it.each([false, true, ''])(
    'renders no start item slot for an item of %j, which React renders as nothing',
    (item) => {
      const { container } = render(<Badge startItem={item}>New</Badge>)
      expect(container.querySelector('[data-slot="badge-start-item"]')).toBeNull()
    },
  )
  it('passes className and the remaining span props through to the root', () => {
    const { container } = render(
      <Badge className="text-caption" data-tone="success" title="Accepted on Monday">
        Accepted
      </Badge>,
    )
    const root = rootOf(container)
    expect(root.getAttribute('class')).toBe('text-caption')
    expect(root.getAttribute('data-tone')).toBe('success')
    expect(root.getAttribute('title')).toBe('Accepted on Monday')
  })
  it('hands its ref to the span root', () => {
    const ref = createRef<HTMLSpanElement>()
    const { container } = render(<Badge ref={ref}>New</Badge>)
    expect(ref.current).toBe(rootOf(container))
  })
  it('renders the child element with asChild, carrying the badge slot and the start item', () => {
    render(
      <Badge asChild startItem={DOT} className="badge">
        <a href="/lots/12" className="lot">
          Lot 12
        </a>
      </Badge>,
    )
    const link = screen.getByRole('link', { name: 'Lot 12' })
    expect(link.getAttribute('data-slot')).toBe('badge')
    expect(link.getAttribute('class')?.split(' ').sort()).toEqual(['badge', 'lot'])
    expect(link.firstElementChild?.getAttribute('data-slot')).toBe('badge-start-item')
  })
  it('reads a variable a wrapper sets, the way a theme maps the badge', () => {
    const { container } = render(
      <div style={THEME}>
        <Badge>New</Badge>
      </div>,
    )
    expect(getComputedStyle(rootOf(container)).getPropertyValue('--badge-background-color')).toBe(
      'rgb(1, 2, 3)',
    )
  })
})
