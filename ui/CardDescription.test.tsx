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
  it('renders a p with no typography of its own', () => {
    render(<CardDescription>Open until 20h</CardDescription>)
    const description = screen.getByText('Open until 20h')
    expect(description.tagName).toBe('P')
    expect(description.hasAttribute('class')).toBe(false)
  })
  it('sets no id outside a Card, where there is nothing to describe', () => {
    render(<CardDescription>Open until 20h</CardDescription>)
    expect(screen.getByText('Open until 20h').hasAttribute('id')).toBe(false)
  })
  it('hands the id and the slot to the element a function child returns, whose own undefined id comes first', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription className="description">
          {(props) => (
            <div id={undefined} {...props}>
              Open until 20h
            </div>
          )}
        </CardDescription>
      </Card>,
    )
    const description = screen.getByText('Open until 20h')
    expect(description.tagName).toBe('DIV')
    expect(description.getAttribute('data-slot')).toBe('card-description')
    expect(description.getAttribute('class')).toBe('description')
    expect(screen.getByRole('article', { description: 'Open until 20h' })).toBeTruthy()
  })
  it('passes className and the remaining paragraph props through to the root', () => {
    render(
      <CardDescription className="text-body" title="Closing time">
        Open until 20h
      </CardDescription>,
    )
    const description = screen.getByText('Open until 20h')
    expect(description.getAttribute('class')).toBe('text-body')
    expect(description.getAttribute('title')).toBe('Closing time')
  })
  it('hands its ref to the p root', () => {
    const ref = createRef<HTMLParagraphElement>()
    render(<CardDescription ref={ref}>Open until 20h</CardDescription>)
    expect(ref.current).toBe(screen.getByText('Open until 20h'))
  })
  it('hands its ref to the element a function child returns', () => {
    const ref = createRef<HTMLParagraphElement>()
    render(
      <CardDescription ref={ref}>{(props) => <span {...props}>Open until 20h</span>}</CardDescription>,
    )
    expect(ref.current).toBe(screen.getByText('Open until 20h'))
  })
  it('keeps the ref a function child sets before the spread when the component is given none', () => {
    const paragraphRef = createRef<HTMLParagraphElement>()
    render(
      <CardDescription>
        {(props) => (
          <p ref={paragraphRef} {...props}>
            Open until 20h
          </p>
        )}
      </CardDescription>,
    )
    expect(paragraphRef.current).toBe(screen.getByText('Open until 20h'))
  })
})
