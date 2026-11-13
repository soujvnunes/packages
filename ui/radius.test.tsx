import { cleanup, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { Bar } from './Bar'
import { Button } from './Button'
import { ButtonGroup } from './ButtonGroup'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
import { Field } from './Field'
import { Input } from './Input'
const STYLES = `${import.meta.dirname}/styles`
const RULES = readdirSync(STYLES)
  .filter((file) => file.endsWith('.css'))
  .sort()
  .flatMap((file) => readFileSync(`${STYLES}/${file}`, 'utf8').split('}'))
  .filter((chunk) => chunk.includes('{'))
  .map((chunk) => {
    const parts = chunk.split('{')
    const declarations = (parts.at(-1) ?? '')
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const colon = declaration.indexOf(':')
        return {
          name: declaration.slice(0, colon).trim(),
          value: declaration
            .slice(colon + 1)
            .replace(/\s+/g, ' ')
            .trim(),
        }
      })
    return { selector: parts.at(-2)?.trim() ?? '', declarations }
  })
const THEME: Record<string, string> = {
  '--spacing': '1px',
  '--radius-4': '4px',
  '--radius-8': '8px',
  '--radius-12': '12px',
  '--radius-16': '16px',
  '--radius-24': '24px',
  '--radius-40': '40px',
}
const PRODUCT_RADIUS: React.CSSProperties & Record<`--${string}`, string> = {
  '--input-md-radius': '4px',
  '--badge-radius': '4px',
}
const BAR_RADIUS: React.CSSProperties & Record<`--${string}`, string> = { '--bar-radius': '40px' }
const CORNERS = [
  'border-start-start-radius',
  'border-start-end-radius',
  'border-end-start-radius',
  'border-end-end-radius',
] as const
const selects = (element: Element, selector: string) => {
  try {
    return element.matches(selector)
  } catch {
    return false
  }
}
const lastDeclared = (element: Element, names: readonly string[]) =>
  RULES.filter((rule) => selects(element, rule.selector))
    .flatMap((rule) => rule.declarations)
    .filter((declaration) => names.includes(declaration.name))
    .at(-1)?.value
const closingParenthesis = (value: string, open: number) => {
  let depth = 0
  for (let index = open; index < value.length; index += 1) {
    if (value[index] === '(') depth += 1
    if (value[index] === ')') depth -= 1
    if (depth === 0) return index
  }
  throw new Error(`No closing parenthesis in ${value}.`)
}
const substitute = (
  value: string,
  lookup: (name: string) => string | undefined,
): string | undefined => {
  const start = value.indexOf('var(')
  if (start === -1) return value
  const end = closingParenthesis(value, start + 3)
  const inner = value.slice(start + 4, end)
  const comma = inner.indexOf(',')
  const name = (comma === -1 ? inner : inner.slice(0, comma)).trim()
  const fallback = comma === -1 ? undefined : inner.slice(comma + 1)
  const resolved = lookup(name) ?? (fallback === undefined ? undefined : substitute(fallback, lookup))
  if (resolved === undefined) return undefined
  return substitute(`${value.slice(0, start)}${resolved}${value.slice(end + 1)}`, lookup)
}
const customOn = (element: Element | null, name: string): string | undefined => {
  if (element === null) return THEME[name]
  const inline = element instanceof HTMLElement ? element.style.getPropertyValue(name) : ''
  const declared = inline === '' ? lastDeclared(element, [name]) : inline
  if (declared === undefined) return customOn(element.parentElement, name)
  if (declared === 'initial') return undefined
  return substitute(declared, (reference) => customOn(element, reference))
}
const OPERATIONS: Record<string, (left: number, right: number) => number> = {
  '+': (left, right) => left + right,
  '-': (left, right) => left - right,
  '*': (left, right) => left * right,
  '/': (left, right) => left / right,
}
const evaluate = (expression: string) => {
  const tokens = expression.match(/-?\d*\.?\d+(?:px)?|[a-z]+\(|[()+*/,-]/g) ?? []
  let position = 0
  const take = () => {
    const token = tokens[position]
    position += 1
    return token
  }
  const close = () => {
    if (take() !== ')') throw new Error(`Unbalanced ${expression}.`)
  }
  const chain = (operators: readonly string[], operand: () => number) => {
    let value = operand()
    for (let token = tokens[position]; token !== undefined && operators.includes(token);) {
      position += 1
      value = OPERATIONS[token]?.(value, operand()) ?? Number.NaN
      token = tokens[position]
    }
    return value
  }
  const factor = (): number => {
    const token = take()
    if (token === '(' || token === 'calc(') {
      const value = sum()
      close()
      return value
    }
    if (token === 'max(' || token === 'min(') {
      const values = [sum()]
      while (tokens[position] === ',') {
        position += 1
        values.push(sum())
      }
      close()
      return token === 'max(' ? Math.max(...values) : Math.min(...values)
    }
    if (token !== undefined && /\d/.test(token)) return Number.parseFloat(token)
    throw new Error(`Cannot read ${expression} at ${String(token)}.`)
  }
  const product = () => chain(['*', '/'], factor)
  const sum = (): number => chain(['+', '-'], product)
  const value = sum()
  if (position !== tokens.length) throw new Error(`Cannot read the end of ${expression}.`)
  return value
}
const publishedBy = (element: Element, name: string) => {
  const value = customOn(element, name)
  return value === undefined ? undefined : evaluate(value)
}
const radiiOf = (element: Element) =>
  CORNERS.map((corner) => {
    const declared = lastDeclared(element, [corner, 'border-radius'])
    const value =
      declared === undefined ? undefined : substitute(declared, (name) => customOn(element, name))
    return value === undefined ? 0 : evaluate(value)
  })
const slotIn = (container: HTMLElement, slot: string, index = 0) => {
  const element = container.querySelectorAll(`[data-slot="${slot}"]`)[index]
  if (!element) throw new Error(`No ${slot} slot at ${index}.`)
  return element
}
const all = (radius: number) => CORNERS.map(() => radius)
afterEach(cleanup)
describe('A Field', () => {
  it('publishes 16, its radius of 40 less its inline padding of 24, and an Input in it reads 16 on every corner', () => {
    const { container } = render(
      <Field label="Max bid">{(control) => <Input {...control} kind="fullWidth" />}</Field>,
    )
    expect(publishedBy(slotIn(container, 'field'), '--ui-inner-radius-64')).toBe(16)
    expect(radiiOf(slotIn(container, 'input'))).toEqual(all(16))
  })
})
describe('A ButtonGroup', () => {
  it('publishes 16, and its first and last Buttons take it on their outer side while every inner side is square', () => {
    render(
      <ButtonGroup aria-label="Period">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>,
    )
    expect(publishedBy(screen.getByRole('group'), '--ui-inner-radius-64')).toBe(16)
    const [day, week, month] = screen.getAllByRole('button')
    if (!day || !week || !month) throw new Error('A button of the group is missing.')
    expect(radiiOf(day)).toEqual([16, 0, 16, 0])
    expect(radiiOf(week)).toEqual(all(0))
    expect(radiiOf(month)).toEqual([0, 16, 0, 16])
  })
  it('gives the top of the first Button and the bottom of the last 16 in a vertical group', () => {
    render(
      <ButtonGroup aria-label="Period" orientation="vertical">
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>,
    )
    const [day, week, month] = screen.getAllByRole('button')
    if (!day || !week || !month) throw new Error('A button of the group is missing.')
    expect(radiiOf(day)).toEqual([16, 16, 0, 0])
    expect(radiiOf(week)).toEqual(all(0))
    expect(radiiOf(month)).toEqual([0, 0, 16, 16])
  })
  it('joins an Input and a Button the same way, each taking 16 on its outer side', () => {
    const { container } = render(
      <ButtonGroup aria-label="Search">
        <Input aria-label="Plate" />
        <Button>Search</Button>
      </ButtonGroup>,
    )
    expect(radiiOf(slotIn(container, 'input'))).toEqual([16, 0, 16, 0])
    expect(radiiOf(screen.getByRole('button'))).toEqual([0, 16, 0, 16])
  })
})
describe('A Card', () => {
  it('publishes 12, its radius of 24 less its padding of 12, and a Button, a card Button, an Input and a Badge in it read 12', () => {
    const { container } = render(
      <Card>
        <CardTitle>Lot 12</CardTitle>
        <CardDescription>Open until 20h</CardDescription>
        <Badge>New</Badge>
        <Input aria-label="Max bid" />
        <Button kind="card">Volkswagen Fusca 1973</Button>
        <Button>Place a bid</Button>
      </Card>,
    )
    expect(publishedBy(screen.getByRole('article'), '--ui-inner-radius-card')).toBe(12)
    expect(radiiOf(screen.getByRole('button', { name: 'Place a bid' }))).toEqual(all(12))
    expect(radiiOf(screen.getByRole('button', { name: 'Volkswagen Fusca 1973' }))).toEqual(all(12))
    expect(radiiOf(slotIn(container, 'input'))).toEqual(all(12))
    expect(radiiOf(screen.getByText('New'))).toEqual(all(12))
  })
  it('still publishes 12 when a Bar holds it directly, so the bar clearing the card radius for its children never reaches a card', () => {
    render(
      <Bar>
        <Card>
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
          <Button>Place a bid</Button>
        </Card>
      </Bar>,
    )
    expect(publishedBy(screen.getByRole('article'), '--ui-inner-radius-card')).toBe(12)
    expect(radiiOf(screen.getByRole('button'))).toEqual(all(12))
  })
  it('clears the inner radius of a Field around it, so what it holds reads the card first', () => {
    const { container } = render(
      <Field label="Lot">
        {() => (
          <Card>
            <CardTitle>Lot 12</CardTitle>
            <CardDescription>Open until 20h</CardDescription>
            <Button>Place a bid</Button>
          </Card>
        )}
      </Field>,
    )
    expect(publishedBy(slotIn(container, 'card'), '--ui-inner-radius-64')).toBeUndefined()
    expect(radiiOf(screen.getByRole('button'))).toEqual(all(12))
  })
})
describe('A product radius on a control', () => {
  it('loses to the inner radius of a Card or a Field, and holds outside them', () => {
    const { container } = render(
      <div style={PRODUCT_RADIUS}>
        <Card>
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
          <Input aria-label="Max bid" />
          <Badge>New</Badge>
        </Card>
        <Field label="Plate" endItem={<Badge>BRL</Badge>}>
          {(control) => <Input {...control} />}
        </Field>
        <Input aria-label="Lot number" />
        <Badge>Live</Badge>
      </div>,
    )
    expect(radiiOf(slotIn(container, 'input', 0))).toEqual(all(12))
    expect(radiiOf(screen.getByText('New'))).toEqual(all(12))
    expect(radiiOf(slotIn(container, 'input', 1))).toEqual(all(16))
    expect(radiiOf(screen.getByText('BRL'))).toEqual(all(16))
    expect(radiiOf(slotIn(container, 'input', 2))).toEqual(all(4))
    expect(radiiOf(screen.getByText('Live'))).toEqual(all(4))
  })
})
describe('A Bar', () => {
  it('publishes nothing while --bar-radius is unmapped, so a Button in it keeps its own 24, inside a Card too', () => {
    const { container } = render(
      <>
        <Bar>
          <Button>Watch</Button>
        </Bar>
        <Card>
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
          <Bar>
            <Button>Place a bid</Button>
          </Bar>
        </Card>
      </>,
    )
    expect(radiiOf(slotIn(container, 'bar', 0))).toEqual(all(0))
    expect(publishedBy(slotIn(container, 'bar', 0), '--ui-inner-radius-64')).toBeUndefined()
    expect(radiiOf(screen.getByRole('button', { name: 'Watch' }))).toEqual(all(24))
    expect(radiiOf(screen.getByRole('button', { name: 'Place a bid' }))).toEqual(all(24))
  })
  it('publishes its mapped radius less its inline padding of 24', () => {
    render(
      <Bar style={BAR_RADIUS}>
        <Button>Watch</Button>
      </Bar>,
    )
    expect(radiiOf(screen.getByRole('button'))).toEqual(all(16))
  })
})
describe('A sibling outside a container', () => {
  it('keeps the default radius of its own height: 12 at 24, 24 at 40 and 40 at 64', () => {
    const { container } = render(
      <>
        <Badge>New</Badge>
        <Button>Watch</Button>
        <Input aria-label="Lot number" size="lg" />
      </>,
    )
    expect(radiiOf(screen.getByText('New'))).toEqual(all(12))
    expect(radiiOf(screen.getByRole('button'))).toEqual(all(24))
    expect(radiiOf(slotIn(container, 'input'))).toEqual(all(40))
  })
})
