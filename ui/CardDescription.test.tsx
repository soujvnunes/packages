import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
afterEach(cleanup)
describe('CardDescription', () => {
  it('takes the description id of the Card it sits in, so the Card is described by it', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    const description = screen.getByText('Open until 20h')
    expect(description.getAttribute('data-slot')).toBe('card-description')
    expect(description.id).toBe(screen.getByRole('article').getAttribute('aria-describedby'))
  })
  it('renders a div with no typography of its own', () => {
    render(<CardDescription>Open until 20h</CardDescription>)
    const description = screen.getByText('Open until 20h')
    expect(description.tagName).toBe('DIV')
    expect(description.hasAttribute('class')).toBe(false)
  })
  it('sets no id outside a Card, where there is nothing to describe', () => {
    render(<CardDescription>Open until 20h</CardDescription>)
    expect(screen.getByText('Open until 20h').hasAttribute('id')).toBe(false)
  })
  it('renders the child element with asChild, carrying the id and the slot', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription asChild className="description">
          <p className="text-body">Open until 20h</p>
        </CardDescription>
      </Card>,
    )
    const paragraph = screen.getByText('Open until 20h')
    expect(paragraph.tagName).toBe('P')
    expect(paragraph.getAttribute('data-slot')).toBe('card-description')
    expect(paragraph.getAttribute('class')?.split(' ').sort()).toEqual(['description', 'text-body'])
    expect(screen.getByRole('article', { description: 'Open until 20h' })).toBeTruthy()
  })
  it('passes className and the remaining div props through to the root', () => {
    render(
      <CardDescription className="text-body" title="Closing time">
        Open until 20h
      </CardDescription>,
    )
    const description = screen.getByText('Open until 20h')
    expect(description.getAttribute('class')).toBe('text-body')
    expect(description.getAttribute('title')).toBe('Closing time')
  })
  it('hands its ref to the div root', () => {
    const ref = createRef<HTMLDivElement>()
    render(<CardDescription ref={ref}>Open until 20h</CardDescription>)
    expect(ref.current).toBe(screen.getByText('Open until 20h'))
  })
})
