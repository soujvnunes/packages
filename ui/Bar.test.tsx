import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { BADGE_CORNERS, Badge } from './Badge'
import { Bar } from './Bar'
import { Button } from './Button'
const STYLESHEET = ['badge', 'bar', 'button', 'input', 'radius']
  .map((name) => readFileSync(`${import.meta.dirname}/styles/${name}.css`, 'utf8'))
  .join('\n')
const selectorWith = (declaration: string) => {
  const selectors = STYLESHEET.split('}')
    .filter((chunk) => chunk.replace(/\s/g, '').includes(declaration))
    .map((rule) => rule.split('{').at(-2)?.trim())
    .filter(Boolean)
  if (selectors.length === 0) throw new Error(`No rule of the stylesheets holds ${declaration}.`)
  return selectors.join(', ')
}
const PUBLISHES_64 = selectorWith('--ui-inner-radius-64:max(')
const READS_64_FIRST = selectorWith('border-radius:var(--ui-inner-radius-64,')
const CORNER_RADIUS: Record<(typeof BADGE_CORNERS)[number], string> = {
  'top-start': 'border-start-start-radius',
  'top-end': 'border-start-end-radius',
  'bottom-start': 'border-end-start-radius',
  'bottom-end': 'border-end-end-radius',
}
const BLOCK_NEIGHBOUR: Record<(typeof BADGE_CORNERS)[number], (typeof BADGE_CORNERS)[number]> = {
  'top-start': 'bottom-start',
  'top-end': 'bottom-end',
  'bottom-start': 'top-start',
  'bottom-end': 'top-end',
}
const cornersMatching = (element: Element, value: string) =>
  BADGE_CORNERS.filter((corner) => element.matches(selectorWith(`${CORNER_RADIUS[corner]}:${value};`)))
const ancestorsOf = (element: Element): Element[] =>
  element.parentElement ? [element.parentElement, ...ancestorsOf(element.parentElement)] : []
const rootOf = (container: HTMLElement) => {
  const root = container.querySelector('[data-slot="bar"]')
  if (!root) throw new Error('The bar root is missing.')
  return root
}
afterEach(cleanup)
describe('Bar', () => {
  it('renders its children in a div root that carries the bar slot', () => {
    const { container } = render(
      <Bar>
        <Button>Watch</Button>
      </Bar>,
    )
    const root = rootOf(container)
    expect(root.tagName).toBe('DIV')
    expect(root.contains(screen.getByRole('button', { name: 'Watch' }))).toBe(true)
  })
  it('passes className and the remaining div props through to the root', () => {
    const { container } = render(
      <Bar className="col-span-12" id="lot-actions" title="Lot actions">
        Lot 12
      </Bar>,
    )
    const root = rootOf(container)
    expect(root.getAttribute('class')).toBe('col-span-12')
    expect(root.getAttribute('id')).toBe('lot-actions')
    expect(root.getAttribute('title')).toBe('Lot actions')
  })
  it('hands its ref to the div root', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<Bar ref={ref}>Lot 12</Bar>)
    expect(ref.current).toBe(rootOf(container))
  })
  it('renders a header with asChild, which keeps its banner role and takes the bar slot', () => {
    render(
      <Bar asChild className="bar">
        <header className="app">
          <Button>Sign in</Button>
        </header>
      </Bar>,
    )
    const header = screen.getByRole('banner')
    expect(header.getAttribute('data-slot')).toBe('bar')
    expect(header.getAttribute('class')?.split(' ').sort()).toEqual(['app', 'bar'])
    expect(header.contains(screen.getByRole('button', { name: 'Sign in' }))).toBe(true)
  })
  it('renders a toolbar with asChild, whose role and name stay its own', () => {
    render(
      <Bar asChild>
        <div role="toolbar" aria-label="Lot actions">
          <Button>Watch</Button>
        </div>
      </Bar>,
    )
    expect(screen.getByRole('toolbar', { name: 'Lot actions' }).getAttribute('data-slot')).toBe('bar')
  })
  it('holds controls of 40 in a 64 minimum height, through 12 of block padding and 24 inline, two steps below its height', () => {
    const { container } = render(<Bar>Lot 12</Bar>)
    const root = rootOf(container)
    expect(root.matches(selectorWith('min-height:var(--bar-height,calc(var(--spacing)*64));'))).toBe(
      true,
    )
    expect(root.matches(selectorWith('padding-block:var(--bar-py,calc(var(--spacing)*12));'))).toBe(
      true,
    )
    expect(root.matches(selectorWith('padding-inline:var(--bar-px,calc(var(--spacing)*24));'))).toBe(
      true,
    )
  })
  it('wraps its controls onto another row when they do not fit, so none breaks inside or overflows the bar', () => {
    const { container } = render(<Bar>Lot 12</Bar>)
    expect(rootOf(container).matches(selectorWith('flex-wrap:wrap;'))).toBe(true)
  })
})
describe('Bar radius', () => {
  it('takes no radius by default, since it spans what holds it, and publishes none until a product maps --bar-radius', () => {
    const { container } = render(<Bar>Lot 12</Bar>)
    const root = rootOf(container)
    expect(
      root.matches(
        selectorWith(
          '--ui-container-radius:calc(0*var(--bar-radius)+var(--ui-inner-radius-card,var(--bar-radius)));',
        ),
      ),
    ).toBe(true)
    expect(root.matches(selectorWith('border-radius:var(--ui-container-radius,0px);'))).toBe(true)
    expect(STYLESHEET.replace(/\s/g, '')).not.toContain('--bar-radius,')
  })
  it('publishes its inner radius, its radius less its inline padding and never below zero', () => {
    const { container } = render(<Bar>Lot 12</Bar>)
    const root = rootOf(container)
    expect(
      root.matches(selectorWith('--ui-container-padding:var(--bar-px,calc(var(--spacing)*24));')),
    ).toBe(true)
    expect(
      root.matches(
        selectorWith(
          '--ui-inner-radius-64:max(0px,var(--ui-container-radius)-var(--ui-container-padding));',
        ),
      ),
    ).toBe(true)
  })
  it('gives a card button within it its inner radius before its own, from the bar alone', () => {
    const { container } = render(
      <Bar>
        <Button kind="card">Lot 12</Button>
      </Bar>,
    )
    const card = screen.getByRole('button', { name: 'Lot 12' })
    expect(card.matches(READS_64_FIRST)).toBe(true)
    expect(ancestorsOf(card).filter((ancestor) => ancestor.matches(PUBLISHES_64))).toEqual([
      rootOf(container),
    ])
  })
  it('publishes nothing to a sibling, which keeps the default radius of its own height', () => {
    render(
      <>
        <Bar>
          <Button>Inside</Button>
        </Bar>
        <Button>Beside</Button>
      </>,
    )
    const beside = screen.getByRole('button', { name: 'Beside' })
    expect(ancestorsOf(beside).some((ancestor) => ancestor.matches(PUBLISHES_64))).toBe(false)
  })
  it('keeps a full radius full, since the inner radius has a floor at zero and no ceiling', () => {
    const published = STYLESHEET.replace(/\s/g, '').match(/--ui-inner-radius-64:([^;]+);/)?.[1]
    expect(published).toMatch(/^max\(0px,/)
    expect(published).not.toContain('min(')
  })
})
describe('A badge on the corner of a bar or a button', () => {
  it.each(BADGE_CORNERS)(
    'takes the %s corner, where it shares the radius of what holds it on that corner alone',
    (corner) => {
      const { container } = render(
        <Bar>
          <Badge data-corner={corner}>New</Badge>
        </Bar>,
      )
      const badge = screen.getByText('New')
      expect(badge.getAttribute('data-corner')).toBe(corner)
      expect(badge.parentElement).toBe(rootOf(container))
      expect(cornersMatching(badge, 'var(--ui-badge-corner-radius)')).toEqual([corner])
    },
  )
  it.each(BADGE_CORNERS)(
    'squares the corner beside %s on its block side and rounds the free ones by half its height, so no side of the badge holds more radius than its length and the browser scales no corner',
    (corner) => {
      render(
        <Bar>
          <Badge data-corner={corner}>New</Badge>
        </Bar>,
      )
      const badge = screen.getByText('New')
      expect(cornersMatching(badge, '0')).toEqual([BLOCK_NEIGHBOUR[corner]])
      expect(
        badge.matches(
          selectorWith('border-radius:calc(var(--badge-height,calc(var(--spacing)*24))/2);'),
        ),
      ).toBe(true)
      expect(
        badge.matches(
          selectorWith(
            '--ui-badge-corner-radius:min(var(--ui-corner-radius,0px),var(--badge-height,calc(var(--spacing)*24)));',
          ),
        ),
      ).toBe(true)
    },
  )
  it('shares the radius a bar publishes for its corners, none until a product maps --bar-radius', () => {
    const { container } = render(
      <Bar>
        <Badge data-corner="top-end">New</Badge>
      </Bar>,
    )
    expect(
      rootOf(container).matches(selectorWith('--ui-corner-radius:var(--ui-container-radius,0px);')),
    ).toBe(true)
  })
  it('shares the own radius of the button it sits on, not the inner radius a badge within it reads', () => {
    render(
      <Button kind="card" startItem="Lot 12">
        Volkswagen Fusca 1973
        <Badge data-corner="top-end">New</Badge>
      </Button>,
    )
    const button = screen.getByRole('button')
    const badge = screen.getByText('New')
    expect(badge.parentElement).toBe(button)
    expect(badge.matches(selectorWith('border-start-end-radius:var(--ui-badge-corner-radius);'))).toBe(
      true,
    )
    expect(button.matches(selectorWith('border-radius:var(--ui-inner-radius-64,'))).toBe(true)
    expect(
      button.matches(
        selectorWith(
          '--ui-corner-radius:var(--ui-inner-radius-64,var(--ui-inner-radius-card,var(--button-card-md-radius,var(--radius-16))));',
        ),
      ),
    ).toBe(true)
  })
  it('shares the drawn corner of a text button, its radius held to half its height', () => {
    render(
      <Button>
        Lot 12
        <Badge data-corner="top-end">New</Badge>
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button.matches(selectorWith('--ui-corner-radius:min(var(--button-md-radius,'))).toBe(true)
    expect(button.matches(selectorWith(',var(--button-md-height,calc(var(--spacing)*40))/2);'))).toBe(
      true,
    )
  })
  it('lifts the badge onto the corner and positions what holds it, so the corner is its own', () => {
    render(
      <Button>
        Lot 12
        <Badge data-corner="top-end">New</Badge>
      </Button>,
    )
    expect(screen.getByText('New').matches(selectorWith('position:absolute;'))).toBe(true)
    expect(screen.getByRole('button').matches(selectorWith('position:relative;'))).toBe(true)
  })
  it('leaves a badge with no corner within its button, where it reads the inner radius', () => {
    render(
      <Button>
        <Badge>New</Badge>
        Lot 12
      </Button>,
    )
    const badge = screen.getByText('New')
    expect(badge.matches(selectorWith('position:absolute;'))).toBe(false)
    expect(screen.getByRole('button').matches(selectorWith('position:relative;'))).toBe(false)
    expect(badge.matches(selectorWith('var(--ui-inner-radius-40,'))).toBe(true)
  })
})
