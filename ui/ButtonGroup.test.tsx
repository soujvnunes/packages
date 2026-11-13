import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Bar } from './Bar'
import { Button } from './Button'
import { BUTTON_GROUP_ORIENTATIONS, ButtonGroup } from './ButtonGroup'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
import { Input } from './Input'
const STYLESHEET = ['button-group', 'button', 'input', 'radius']
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
const CORNERS = [
  'border-start-start-radius',
  'border-start-end-radius',
  'border-end-start-radius',
  'border-end-end-radius',
] as const
const squaredCornersOf = (element: Element) =>
  CORNERS.filter((corner) => element.matches(selectorWith(`${corner}:0;`)))
const TabList = (props: React.ComponentProps<'div'>) => <div role="tablist" {...props} />
afterEach(cleanup)
describe('ButtonGroup', () => {
  it('renders a group named by its label, horizontal by default, around its buttons', () => {
    render(
      <ButtonGroup aria-label="Lot actions">
        <Button>Watch</Button>
        <Button>Share</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group', { name: 'Lot actions' })
    expect(group.getAttribute('data-slot')).toBe('button-group')
    expect(group.getAttribute('data-orientation')).toBe('horizontal')
    expect(group.contains(screen.getByRole('button', { name: 'Share' }))).toBe(true)
  })
  it.each(BUTTON_GROUP_ORIENTATIONS)(
    'carries the %s orientation as its data-orientation attribute, for the stylesheet to read',
    (orientation) => {
      render(
        <ButtonGroup aria-label="Period" orientation={orientation}>
          <Button>Day</Button>
        </ButtonGroup>,
      )
      expect(screen.getByRole('group').getAttribute('data-orientation')).toBe(orientation)
    },
  )
  it('takes the role it is given in place of group', () => {
    render(
      <ButtonGroup role="toolbar" aria-label="Lot actions">
        <Button>Watch</Button>
      </ButtonGroup>,
    )
    expect(screen.getByRole('toolbar', { name: 'Lot actions' }).getAttribute('data-slot')).toBe(
      'button-group',
    )
    expect(screen.queryByRole('group')).toBeNull()
  })
  it('passes className and the remaining div props through to the root', () => {
    render(
      <ButtonGroup aria-label="Period" className="col-span-4" id="period">
        <Button>Day</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group')
    expect(group.getAttribute('class')).toBe('col-span-4')
    expect(group.getAttribute('id')).toBe('period')
  })
  it('hands its ref to the div root', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <ButtonGroup ref={ref} aria-label="Period">
        <Button>Day</Button>
      </ButtonGroup>,
    )
    expect(ref.current).toBe(screen.getByRole('group'))
  })
  it('makes a tab list with asChild: the tablist role stays, and each tab built from a Button stays a tab', () => {
    render(
      <ButtonGroup asChild className="tabs">
        <div role="tablist" aria-label="Lot" className="list">
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
        </div>
      </ButtonGroup>,
    )
    const list = screen.getByRole('tablist', { name: 'Lot' })
    expect(list.getAttribute('data-slot')).toBe('button-group')
    expect(list.getAttribute('data-orientation')).toBe('horizontal')
    expect(list.getAttribute('class')?.split(' ').sort()).toEqual(['list', 'tabs'])
    expect(screen.queryByRole('group')).toBeNull()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.getAttribute('data-slot'))).toEqual(['button', 'button'])
    expect(screen.getByRole('tab', { name: 'Bids', selected: true }).parentElement).toBe(list)
  })
  it('passes no role through asChild, so a tabs primitive that sets tablist inside itself keeps it', () => {
    render(
      <ButtonGroup asChild>
        <TabList aria-label="Lot">
          <Button asChild>
            <button type="button" role="tab" aria-selected>
              Bids
            </button>
          </Button>
        </TabList>
      </ButtonGroup>,
    )
    expect(screen.getByRole('tablist', { name: 'Lot' }).getAttribute('data-slot')).toBe('button-group')
  })
  it('publishes its own radius as its inner radius, since it has no padding around the controls it joins', () => {
    render(
      <ButtonGroup aria-label="Period">
        <Button>Day</Button>
        <Button>Week</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group')
    expect(
      group.matches(selectorWith('--ui-container-radius:var(--button-group-radius,var(--radius-12));')),
    ).toBe(true)
    expect(group.matches(selectorWith('--ui-container-padding:0px;'))).toBe(true)
    expect(group.matches(selectorWith('--ui-inner-radius-64:max('))).toBe(true)
    for (const button of screen.getAllByRole('button')) {
      expect(button.matches(selectorWith('border-radius:var(--ui-inner-radius-64,'))).toBe(true)
    }
  })
  it('starts from its own radius in a bar inside a card, since the bar clears the card inner radius for what it holds', () => {
    render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
        <Bar>
          <ButtonGroup aria-label="Period">
            <Button>Day</Button>
            <Button>Week</Button>
          </ButtonGroup>
        </Bar>
      </Card>,
    )
    expect(screen.getByRole('group').matches(selectorWith('--ui-inner-radius-card:initial;'))).toBe(
      true,
    )
  })
  it('keeps the group radius on the outer side of the first and last buttons and squares every inner side', () => {
    render(
      <ButtonGroup aria-label="Period">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>,
    )
    const [day, week, month] = screen.getAllByRole('button')
    if (!day || !week || !month) throw new Error('A button of the group is missing.')
    expect(squaredCornersOf(day)).toEqual(['border-start-end-radius', 'border-end-end-radius'])
    expect(squaredCornersOf(week)).toEqual([...CORNERS])
    expect(squaredCornersOf(month)).toEqual(['border-start-start-radius', 'border-end-start-radius'])
  })
  it('squares the top and bottom inner sides instead in a vertical group', () => {
    render(
      <ButtonGroup aria-label="Period" orientation="vertical">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>,
    )
    const [day, week, month] = screen.getAllByRole('button')
    if (!day || !week || !month) throw new Error('A button of the group is missing.')
    expect(squaredCornersOf(day)).toEqual(['border-end-start-radius', 'border-end-end-radius'])
    expect(squaredCornersOf(week)).toEqual([...CORNERS])
    expect(squaredCornersOf(month)).toEqual(['border-start-start-radius', 'border-start-end-radius'])
  })
  it('pulls every button after the first back by one border width, so each seam is a single line', () => {
    render(
      <ButtonGroup aria-label="Period">
        <Button>Day</Button>
        <Button>Week</Button>
      </ButtonGroup>,
    )
    const [day, week] = screen.getAllByRole('button')
    if (!day || !week) throw new Error('A button of the group is missing.')
    const PULLED_BACK = selectorWith(
      'margin-inline-start:calc(var(--button-border-width,calc(var(--spacing)*1))*-1);',
    )
    expect(week.matches(PULLED_BACK)).toBe(true)
    expect(day.matches(PULLED_BACK)).toBe(false)
  })
  it('lifts the selected tab above the next one, so the pulled-back seam never covers its pressed border', () => {
    render(
      <ButtonGroup asChild>
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
        </div>
      </ButtonGroup>,
    )
    const LIFTED = selectorWith('z-index:1;')
    expect(screen.getByRole('tab', { name: 'Bids', selected: true }).matches(LIFTED)).toBe(true)
    expect(screen.getByRole('tab', { name: 'History', selected: false }).matches(LIFTED)).toBe(false)
  })
  it('lifts an invalid input above the next button, so the pulled-back seam never covers its error border', () => {
    const { container } = render(
      <>
        <ButtonGroup aria-label="Bid">
          <Input aria-label="Max bid" aria-invalid />
          <Button>Bid</Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Search">
          <Input aria-label="Plate" />
          <Button>Search</Button>
        </ButtonGroup>
      </>,
    )
    const [invalid, valid] = container.querySelectorAll('[data-slot="input"]')
    if (!invalid || !valid) throw new Error('An input of the groups is missing.')
    const LIFTED = selectorWith('z-index:1;')
    expect(invalid.matches(LIFTED)).toBe(true)
    expect(valid.matches(LIFTED)).toBe(false)
  })
  it('joins an input to a button the same way', () => {
    const { container } = render(
      <ButtonGroup aria-label="Search">
        <Input aria-label="Plate" />
        <Button>Search</Button>
      </ButtonGroup>,
    )
    const input = container.querySelector('[data-slot="input"]')
    if (!input) throw new Error('The input root is missing.')
    expect(input.matches(selectorWith('border-radius:var(--ui-inner-radius-64,'))).toBe(true)
    expect(squaredCornersOf(input)).toEqual(['border-start-end-radius', 'border-end-end-radius'])
    expect(squaredCornersOf(screen.getByRole('button'))).toEqual([
      'border-start-start-radius',
      'border-end-start-radius',
    ])
  })
  it('keeps a lone button round on every side, since it is both the first and the last', () => {
    render(
      <ButtonGroup aria-label="Period">
        <Button>Day</Button>
      </ButtonGroup>,
    )
    expect(squaredCornersOf(screen.getByRole('button'))).toEqual([])
  })
})
