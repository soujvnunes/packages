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
    const title = screen.getByRole('heading', { name: 'Lot 12' })
    expect(title.getAttribute('data-slot')).toBe('card-title')
    expect(title.id).toBe(screen.getByRole('article').getAttribute('aria-labelledby'))
  })
  it('renders an h2 with no typography of its own', () => {
    render(<CardTitle>Lot 12</CardTitle>)
    const title = screen.getByRole('heading', { level: 2, name: 'Lot 12' })
    expect(title.hasAttribute('class')).toBe(false)
  })
  it('sets no id outside a Card, where there is nothing to name', () => {
    render(<CardTitle>Lot 12</CardTitle>)
    expect(screen.getByRole('heading', { name: 'Lot 12' }).hasAttribute('id')).toBe(false)
  })
  it('hands the id and the slot to the element a function child returns, whose own undefined id comes first', () => {
    render(
      <Card>
        <CardTitle className="title">
          {(props) => (
            <h3 id={undefined} {...props}>
              Lot 12
            </h3>
          )}
        </CardTitle>
        <CardDescription>Open until 20h</CardDescription>
      </Card>,
    )
    const heading = screen.getByRole('heading', { level: 3, name: 'Lot 12' })
    expect(heading.getAttribute('data-slot')).toBe('card-title')
    expect(heading.getAttribute('class')).toBe('title')
    expect(screen.getByRole('article', { name: 'Lot 12' })).toBeTruthy()
  })
  it('passes className and the remaining heading props through to the root', () => {
    render(
      <CardTitle className="text-title" title="Volkswagen Fusca 1973">
        Lot 12
      </CardTitle>,
    )
    const title = screen.getByRole('heading', { name: 'Lot 12' })
    expect(title.getAttribute('class')).toBe('text-title')
    expect(title.getAttribute('title')).toBe('Volkswagen Fusca 1973')
  })
  it('hands its ref to the h2 root', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(<CardTitle ref={ref}>Lot 12</CardTitle>)
    expect(ref.current).toBe(screen.getByRole('heading', { name: 'Lot 12' }))
  })
  it('hands its ref to the element a function child returns', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(<CardTitle ref={ref}>{(props) => <h3 {...props}>Lot 12</h3>}</CardTitle>)
    expect(ref.current).toBe(screen.getByRole('heading', { level: 3, name: 'Lot 12' }))
  })
  it('keeps the ref a function child sets before the spread when the component is given none', () => {
    const headingRef = createRef<HTMLHeadingElement>()
    render(
      <CardTitle>
        {(props) => (
          <h2 ref={headingRef} {...props}>
            Lot 12
          </h2>
        )}
      </CardTitle>,
    )
    expect(headingRef.current).toBe(screen.getByRole('heading', { name: 'Lot 12' }))
  })
})
