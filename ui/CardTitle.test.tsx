import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
afterEach(cleanup)
describe('CardTitle', () => {
  it('takes the title id of the Card it sits in, so the Card is named by it', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    const title = screen.getByText('Lot 12')
    expect(title.getAttribute('data-slot')).toBe('card-title')
    expect(title.id).toBe(screen.getByRole('article').getAttribute('aria-labelledby'))
  })
  it('renders a div with no typography of its own', () => {
    render(<CardTitle>Lot 12</CardTitle>)
    const title = screen.getByText('Lot 12')
    expect(title.tagName).toBe('DIV')
    expect(title.hasAttribute('class')).toBe(false)
  })
  it('sets no id outside a Card, where there is nothing to name', () => {
    render(<CardTitle>Lot 12</CardTitle>)
    expect(screen.getByText('Lot 12').hasAttribute('id')).toBe(false)
  })
  it('renders the child element with asChild, which keeps its role and takes the id and the slot', () => {
    render(
      <Card>
        <CardTitle asChild className="title">
          <h2 className="text-title">Lot 12</h2>
        </CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    const heading = screen.getByRole('heading', { level: 2, name: 'Lot 12' })
    expect(heading.getAttribute('data-slot')).toBe('card-title')
    expect(heading.getAttribute('class')?.split(' ').sort()).toEqual(['text-title', 'title'])
    expect(screen.getByRole('article', { name: 'Lot 12' })).toBeTruthy()
  })
  it('passes className and the remaining div props through to the root', () => {
    render(
      <CardTitle className="text-title" title="Volkswagen Fusca 1973">
        Lot 12
      </CardTitle>,
    )
    const title = screen.getByText('Lot 12')
    expect(title.getAttribute('class')).toBe('text-title')
    expect(title.getAttribute('title')).toBe('Volkswagen Fusca 1973')
  })
  it('hands its ref to the div root', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardTitle ref={ref}>Lot 12</CardTitle>)
    expect(ref.current).toBe(screen.getByText('Lot 12'))
  })
})
