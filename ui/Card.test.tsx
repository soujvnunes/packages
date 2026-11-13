import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Bar } from './Bar'
import { Button } from './Button'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
const STYLESHEET = ['bar', 'button', 'card', 'radius']
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
const consoleError = vi.spyOn(console, 'error')
beforeEach(() => {
  consoleError.mockReset().mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})
describe('Card', () => {
  it('renders an article named by its CardTitle and described by its CardDescription', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    const card = screen.getByRole('article', { name: 'Lot 12', description: 'Open until 20h' })
    expect(card.getAttribute('data-slot')).toBe('card')
  })
  it('resolves its title and its description at any depth, around or inside the markup a product writes', () => {
    render(
      <Card>
        <header>
          <CardTitle asChild>
            <h3>Volkswagen Fusca 1973</h3>
          </CardTitle>
        </header>
        <section>
          <dl>
            <dt>Status</dt>
            <dd>
              <CardDescription>
                <strong>Open</strong> until 20h
              </CardDescription>
            </dd>
          </dl>
        </section>
      </Card>,
    )
    const card = screen.getByRole('article', {
      name: 'Volkswagen Fusca 1973',
      description: 'Open until 20h',
    })
    expect(card.contains(screen.getByRole('heading', { name: 'Volkswagen Fusca 1973' }))).toBe(true)
  })
  it('keeps the ids of two cards on one page apart', () => {
    render(
      <>
        <Card>
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
        </Card>
        <Card>
          <CardTitle>Lot 13</CardTitle>
          <CardDescription>Closed</CardDescription>
        </Card>
      </>,
    )
    const first = screen.getByRole('article', { name: 'Lot 12', description: 'Open until 20h' })
    const second = screen.getByRole('article', { name: 'Lot 13', description: 'Closed' })
    expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'))
    expect(first.getAttribute('aria-describedby')).not.toBe(second.getAttribute('aria-describedby'))
  })
  it('logs nothing for a card with both parts', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    expect(consoleError).not.toHaveBeenCalled()
  })
  it('logs one error naming the part a card is missing, since its aria-describedby would point at nothing', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
      </Card>,
    )
    expect(consoleError).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(
      'A Card needs a CardTitle and a CardDescription inside it, and this one has no CardDescription.',
    )
  })
  it('names both parts in its one error when a card has neither', () => {
    render(<Card>Lot 12</Card>)
    expect(consoleError).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(
      'A Card needs a CardTitle and a CardDescription inside it, and this one has no CardTitle and no CardDescription.',
    )
  })
  it('logs nothing in production, where the check does not run', () => {
    vi.stubEnv('NODE_ENV', 'production')
    render(<Card>Lot 12</Card>)
    expect(consoleError).not.toHaveBeenCalled()
  })
  it('renders the child element with asChild, carrying the card slot and the label it points at', () => {
    render(
      <Card asChild className="card">
        <section className="lot">
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
        </section>
      </Card>,
    )
    const region = screen.getByRole('region', { name: 'Lot 12', description: 'Open until 20h' })
    expect(region.getAttribute('data-slot')).toBe('card')
    expect(region.getAttribute('class')?.split(' ').sort()).toEqual(['card', 'lot'])
    expect(screen.queryByRole('article')).toBeNull()
  })
  it('passes className and the remaining article props through to the root', () => {
    render(
      <Card className="col-span-4" title="Lot 12" data-lot="12">
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    const card = screen.getByRole('article')
    expect(card.getAttribute('class')).toBe('col-span-4')
    expect(card.getAttribute('title')).toBe('Lot 12')
    expect(card.getAttribute('data-lot')).toBe('12')
  })
  it('hands its ref to the article root', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Card ref={ref}>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    expect(ref.current).toBe(screen.getByRole('article'))
  })
  it('publishes its inner radius, its radius less its block padding, to a card button within it', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
        <Button kind="card">Place a bid</Button>
      </Card>,
    )
    const card = screen.getByRole('article')
    expect(
      card.matches(selectorWith('--ui-container-radius:var(--card-radius,var(--radius-24));')),
    ).toBe(true)
    expect(
      card.matches(selectorWith('--ui-container-padding:var(--card-py,calc(var(--spacing)*16));')),
    ).toBe(true)
    expect(
      card.matches(
        selectorWith(
          '--ui-inner-radius-card:max(0px,var(--ui-container-radius)-var(--ui-container-padding));',
        ),
      ),
    ).toBe(true)
    expect(
      screen
        .getByRole('button')
        .matches(selectorWith('border-radius:var(--ui-inner-radius-64,var(--ui-inner-radius-card,')),
    ).toBe(true)
  })
  it('clears an inner radius of 64 from around it, so a button within it reads the card first', () => {
    render(
      <Bar>
        <Card>
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
          <Button>Place a bid</Button>
        </Card>
      </Bar>,
    )
    expect(screen.getByRole('article').matches(selectorWith('--ui-inner-radius-64:initial;'))).toBe(
      true,
    )
  })
  it('gives a bar within it its inner radius, from which the bar publishes its own', () => {
    const { container } = render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
        <Bar>
          <Button>Place a bid</Button>
        </Bar>
      </Card>,
    )
    const bar = container.querySelector('[data-slot="bar"]')
    expect(
      bar?.matches(
        selectorWith('border-radius:var(--ui-inner-radius-card,var(--ui-container-radius));'),
      ),
    ).toBe(true)
    expect(bar?.matches(selectorWith('--ui-inner-radius-64:max(0px,var(--ui-inner-radius-card,'))).toBe(
      true,
    )
  })
})
