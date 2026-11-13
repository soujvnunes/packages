import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Button } from './Button'
import { Field } from './Field'
import { Input } from './Input'
const STYLESHEET = ['field', 'input', 'radius']
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
const HINT = 'At least R$ 51.000'
const ERROR = 'Your bid must be at least R$ 51.000'
const rootOf = (container: HTMLElement) => {
  const root = container.querySelector('[data-slot="field"]')
  if (!root) throw new Error('The field root is missing.')
  return root
}
afterEach(cleanup)
describe('Field', () => {
  it('names the control by its label and describes it by its hint', () => {
    const { container } = render(
      <Field label="Max bid" hint={HINT}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    const control = screen.getByRole('textbox', { name: 'Max bid', description: HINT })
    expect(container.querySelector('label[data-slot="field-label"]')?.getAttribute('for')).toBe(
      control.id,
    )
    expect(container.querySelector('[data-slot="field-hint"]')?.textContent).toBe(HINT)
  })
  it('wires a native control as it wires an Input', () => {
    render(
      <Field label="Notes" hint="Shown to the buyer">
        {(control) => <textarea {...control} />}
      </Field>,
    )
    expect(
      screen.getByRole('textbox', { name: 'Notes', description: 'Shown to the buyer' }),
    ).toBeInstanceOf(HTMLTextAreaElement)
  })
  it('shows the error in place of the hint, describes the control by it and marks it invalid', () => {
    const { container } = render(
      <Field label="Max bid" hint={HINT} error={ERROR}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    const control = screen.getByRole('textbox', { name: 'Max bid', description: ERROR })
    expect(control.getAttribute('aria-invalid')).toBe('true')
    expect(rootOf(container).getAttribute('data-invalid')).toBe('true')
    expect(container.querySelector('[data-slot="field-error"]')?.textContent).toBe(ERROR)
    expect(container.querySelector('[data-slot="field-hint"]')).toBeNull()
  })
  it('lets the Input it wraps show its own invalid state from the aria-invalid it receives', () => {
    const { container } = render(
      <Field label="Max bid" error={ERROR}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    expect(container.querySelector('[data-slot="input"]')?.getAttribute('data-invalid')).toBe('true')
  })
  it.each([
    ['no error', undefined],
    ['a false error', false],
    ['an empty error', ''],
    ['a true error', true],
  ])('leaves the control valid and the root unmarked with %s', (_, error) => {
    const { container } = render(
      <Field label="Max bid" hint={HINT} error={error}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    const control = screen.getByRole('textbox', { name: 'Max bid', description: HINT })
    expect(control.hasAttribute('aria-invalid')).toBe(false)
    expect(rootOf(container).hasAttribute('data-invalid')).toBe(false)
    expect(container.querySelector('[data-slot="field-error"]')).toBeNull()
  })
  it('describes the control by nothing when it has neither a hint nor an error', () => {
    render(<Field label="Max bid">{(control) => <Input {...control} />}</Field>)
    expect(screen.getByRole('textbox', { name: 'Max bid' }).hasAttribute('aria-describedby')).toBe(
      false,
    )
  })
  it('keeps its wiring over props the control takes before the spread, an undefined one included', () => {
    const passedThrough = { id: undefined, 'aria-invalid': false }
    render(
      <Field label="Max bid" error={ERROR}>
        {(control) => <Input {...passedThrough} {...control} />}
      </Field>,
    )
    const control = screen.getByRole('textbox', { name: 'Max bid', description: ERROR })
    expect(control.getAttribute('aria-invalid')).toBe('true')
  })
  it('lets a product override its wiring on purpose, by setting the prop after the spread', () => {
    render(
      <Field label="Max bid" error={ERROR}>
        {(control) => <Input {...control} aria-invalid={false} />}
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Max bid' }).getAttribute('aria-invalid')).toBe('false')
  })
  it('lets a product join a description of its own to the one it hands the control', () => {
    render(
      <>
        <p id="rules">Bids close at 20h</p>
        <Field label="Max bid" hint={HINT}>
          {(control) => (
            <Input {...control} aria-describedby={`rules ${control['aria-describedby'] ?? ''}`} />
          )}
        </Field>
      </>,
    )
    expect(
      screen.getByRole('textbox', { name: 'Max bid', description: `Bids close at 20h ${HINT}` }),
    ).toBeTruthy()
  })
  it('gives two fields on one page ids of their own', () => {
    render(
      <>
        <Field label="Max bid" hint={HINT}>
          {(control) => <Input {...control} />}
        </Field>
        <Field label="Plate" hint="Seven characters">
          {(control) => <Input {...control} />}
        </Field>
      </>,
    )
    const bid = screen.getByRole('textbox', { name: 'Max bid', description: HINT })
    const plate = screen.getByRole('textbox', { name: 'Plate', description: 'Seven characters' })
    expect(bid.id).not.toBe(plate.id)
  })
  it('renders the items beside the control in their own slots, where a control in one stays reachable', () => {
    const { container } = render(
      <Field label="Max bid" startItem="R$" endItem={<Button>Bid</Button>}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    const slots = [...rootOf(container).children].map((child) => child.getAttribute('data-slot'))
    expect(slots).toEqual(['field-label', 'field-start-item', 'input', 'field-end-item'])
    expect(screen.getByRole('button', { name: 'Bid' })).toBeTruthy()
  })
  it('renders no item slot it was not given', () => {
    const { container } = render(<Field label="Max bid">{(control) => <Input {...control} />}</Field>)
    expect(container.querySelector('[data-slot$="-item"]')).toBeNull()
  })
  it('renders no item slot for a boolean item, which renders nothing, as the controls read it', () => {
    const { container } = render(
      <Field label="Max bid" startItem endItem={false}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    expect(container.querySelector('[data-slot$="-item"]')).toBeNull()
  })
  it('passes className and the remaining div props through to the root', () => {
    const { container } = render(
      <Field label="Max bid" className="col-span-6" title="Your bid">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const root = rootOf(container)
    expect(root.tagName).toBe('DIV')
    expect(root.getAttribute('class')).toBe('col-span-6')
    expect(root.getAttribute('title')).toBe('Your bid')
  })
  it('hands its ref to the div root', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <Field ref={ref} label="Max bid">
        {(control) => <Input {...control} />}
      </Field>,
    )
    expect(ref.current).toBe(rootOf(container))
  })
  it('renders the element the function returns as the root with asChild, around the control it holds', () => {
    render(
      <ul>
        <Field asChild label="Plate" hint="Seven characters" error="Unknown plate" className="field">
          {(control) => (
            <li className="row">
              <Input {...control} />
            </li>
          )}
        </Field>
      </ul>,
    )
    const item = screen.getByRole('listitem')
    expect(item.getAttribute('data-slot')).toBe('field')
    expect(item.getAttribute('data-invalid')).toBe('true')
    expect(item.getAttribute('class')?.split(' ').sort()).toEqual(['field', 'row'])
    const control = screen.getByRole('textbox', { name: 'Plate', description: 'Unknown plate' })
    expect(item.contains(control)).toBe(true)
    expect(control.getAttribute('aria-invalid')).toBe('true')
  })
  it('is 64 high with 12 of block padding and 24 inline, two steps below its height, inside a radius of 40', () => {
    const { container } = render(<Field label="Max bid">{(control) => <Input {...control} />}</Field>)
    const root = rootOf(container)
    expect(root.matches(selectorWith('min-height:var(--field-height,calc(var(--spacing)*64));'))).toBe(
      true,
    )
    expect(root.matches(selectorWith('padding-block:var(--field-py,calc(var(--spacing)*12));'))).toBe(
      true,
    )
    expect(root.matches(selectorWith('padding-inline:var(--field-px,calc(var(--spacing)*24));'))).toBe(
      true,
    )
    expect(
      root.matches(
        selectorWith(
          '--ui-container-radius:var(--ui-inner-radius-card,var(--field-radius,var(--radius-40)));',
        ),
      ),
    ).toBe(true)
    expect(root.matches(selectorWith('border-radius:var(--ui-container-radius);'))).toBe(true)
  })
  it('leaves 16 for what it holds by default, its radius of 40 less its inline padding of 24', () => {
    const declared = STYLESHEET.replace(/\s/g, '')
    const radius = declared.match(/--field-radius,var\(--radius-(\d+)\)\)\);/)
    const padding = declared.match(
      /--ui-container-padding:var\(--field-px,calc\(var\(--spacing\)\*(\d+)\)\);/,
    )
    expect(Number(radius?.[1]) - Number(padding?.[1])).toBe(16)
  })
  it('insets the label, the hint and the error rows by the control padding, so their text lines up with the input text', () => {
    const { container } = render(
      <>
        <Field label="Max bid" hint={HINT}>
          {(control) => <Input {...control} />}
        </Field>
        <Field label="Plate" error="Unknown plate">
          {(control) => <Input {...control} />}
        </Field>
      </>,
    )
    const rows = ['field-label', 'field-hint', 'field-error'].map((slot) =>
      container.querySelector(`[data-slot="${slot}"]`),
    )
    const insets = selectorWith('padding-inline:var(--field-text-px,calc(var(--spacing)*16));')
    expect(rows.map((row) => row?.matches(insets))).toEqual([true, true, true])
  })
  it('takes the inner radius of a card around it before its own radius, whatever that radius is', () => {
    const { container } = render(<Field label="Max bid">{(control) => <Input {...control} />}</Field>)
    expect(
      rootOf(container).matches(selectorWith('--ui-container-radius:var(--ui-inner-radius-card,')),
    ).toBe(true)
  })
  it('publishes its inner radius, its radius less its inline padding, to the control it holds', () => {
    const { container } = render(<Field label="Max bid">{(control) => <Input {...control} />}</Field>)
    const root = rootOf(container)
    const input = container.querySelector('[data-slot="input"]')
    expect(
      root.matches(selectorWith('--ui-container-padding:var(--field-px,calc(var(--spacing)*24));')),
    ).toBe(true)
    expect(
      root.matches(
        selectorWith(
          '--ui-inner-radius-64:max(0px,var(--ui-container-radius)-var(--ui-container-padding));',
        ),
      ),
    ).toBe(true)
    expect(input?.parentElement).toBe(root)
  })
  it('lets the control take the room the items and the padding leave', () => {
    const { container } = render(
      <Field label="Max bid" endItem="BRL">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = container.querySelector('[data-slot="input"]')
    expect(input?.matches(selectorWith('flex:110;'))).toBe(true)
  })
})
