import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Badge } from './Badge'
const DOT = <svg viewBox="0 0 8 8" />
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
  it('renders no start item slot when it has none, so the label sits alone', () => {
    const { container } = render(<Badge>New</Badge>)
    expect(container.querySelector('[data-slot="badge-start-item"]')).toBeNull()
  })
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
