import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Bar } from './Bar'
import { Button } from './Button'
import { Input } from './Input'
const STYLESHEET = ['bar', 'button', 'input', 'radius']
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
  it('holds controls of 40 in a 64 minimum height, through 12 of block padding', () => {
    const { container } = render(<Bar>Lot 12</Bar>)
    const root = rootOf(container)
    expect(root.matches(selectorWith('min-height:var(--bar-height,calc(var(--spacing)*64));'))).toBe(
      true,
    )
    expect(root.matches(selectorWith('padding-block:var(--bar-py,calc(var(--spacing)*12));'))).toBe(
      true,
    )
    expect(root.matches(selectorWith('padding-inline:var(--bar-px,calc(var(--spacing)*40));'))).toBe(
      true,
    )
  })
})
describe('Bar radius', () => {
  it('publishes its inner radius, its radius less its block padding and never below zero', () => {
    const { container } = render(<Bar>Lot 12</Bar>)
    const root = rootOf(container)
    expect(
      root.matches(selectorWith('--ui-container-radius:var(--bar-radius,var(--radius-24));')),
    ).toBe(true)
    expect(
      root.matches(selectorWith('--ui-container-padding:var(--bar-py,calc(var(--spacing)*12));')),
    ).toBe(true)
    expect(
      root.matches(
        selectorWith(
          '--ui-inner-radius-64:max(0px,var(--ui-inner-radius-card,var(--ui-container-radius))-var(--ui-container-padding));',
        ),
      ),
    ).toBe(true)
  })
  it('gives a button and an input within it its inner radius before their own', () => {
    const { container } = render(
      <Bar>
        <Button>Watch</Button>
        <Input aria-label="Max bid" />
      </Bar>,
    )
    const root = rootOf(container)
    const input = container.querySelector('[data-slot="input"]')
    if (!input) throw new Error('The input root is missing.')
    for (const control of [screen.getByRole('button', { name: 'Watch' }), input]) {
      expect(control.matches(READS_64_FIRST)).toBe(true)
      expect(ancestorsOf(control).filter((ancestor) => ancestor.matches(PUBLISHES_64))).toEqual([root])
    }
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
    expect(beside.matches(selectorWith('var(--button-md-radius,var(--radius-12))'))).toBe(true)
  })
  it('keeps a full radius full, since the inner radius has a floor at zero and no ceiling', () => {
    const published = STYLESHEET.replace(/\s/g, '').match(/--ui-inner-radius-64:([^;]+);/)?.[1]
    expect(published).toMatch(/^max\(0px,/)
    expect(published).not.toContain('min(')
  })
})
