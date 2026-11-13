import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { INPUT_KINDS, INPUT_SIZES, Input } from './Input'
const SEARCH = <svg viewBox="0 0 24 24" />
const THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--input-border-color--invalid': 'rgb(1, 2, 3)',
}
const rootOf = (input: HTMLElement) => {
  const root = input.closest('[data-slot="input"]')
  if (!root) throw new Error('The input root is missing.')
  return root
}
afterEach(cleanup)
describe('Input', () => {
  it('renders a textbox named by its aria-label inside a label root, md and text by default', () => {
    render(<Input aria-label="Plate" />)
    const root = rootOf(screen.getByRole('textbox', { name: 'Plate' }))
    expect(root.tagName).toBe('LABEL')
    expect(root.getAttribute('data-size')).toBe('md')
    expect(root.getAttribute('data-kind')).toBe('text')
  })
  it('labels the input it wraps, so a click anywhere on the root reaches it', () => {
    render(<Input aria-label="Plate" />)
    const input = screen.getByRole('textbox')
    const label = input.closest('label')
    expect(label).toBe(rootOf(input))
    expect(label?.control).toBe(input)
  })
  it.each(INPUT_SIZES)(
    'carries the %s size as its data-size attribute, for the stylesheet to read',
    (size) => {
      render(<Input aria-label="Plate" size={size} />)
      expect(rootOf(screen.getByRole('textbox')).getAttribute('data-size')).toBe(size)
    },
  )
  it.each(INPUT_KINDS)(
    'carries the %s kind as its data-kind attribute, for the stylesheet to read',
    (kind) => {
      render(<Input aria-label="Plate" kind={kind} />)
      expect(rootOf(screen.getByRole('textbox')).getAttribute('data-kind')).toBe(kind)
    },
  )
  it('puts the remaining input props on the input, and each className where it names', () => {
    render(
      <Input
        aria-label="E-mail"
        type="email"
        name="email"
        placeholder="name@example.com"
        className={{ root: 'col-span-6', input: 'text-body' }}
      />,
    )
    const input = screen.getByRole('textbox', { name: 'E-mail' })
    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('name')).toBe('email')
    expect(input.getAttribute('placeholder')).toBe('name@example.com')
    expect(input.getAttribute('class')).toBe('text-body')
    expect(rootOf(input).getAttribute('class')).toBe('col-span-6')
  })
  it('renders the start and end items in their own slots, hidden from assistive technology', () => {
    render(<Input aria-label="Search" startItem={SEARCH} endItem="km" />)
    const root = rootOf(screen.getByRole('textbox', { name: 'Search' }))
    const [start, input, end] = root.children
    expect(start?.getAttribute('data-slot')).toBe('input-start-item')
    expect(start?.getAttribute('aria-hidden')).toBe('true')
    expect(input?.getAttribute('data-slot')).toBe('input-control')
    expect(end?.getAttribute('data-slot')).toBe('input-end-item')
    expect(end?.getAttribute('aria-hidden')).toBe('true')
  })
  it('marks the root invalid when the input is, and only then', () => {
    render(
      <>
        <Input aria-label="Wrong" aria-invalid />
        <Input aria-label="Right" aria-invalid="false" />
      </>,
    )
    expect(rootOf(screen.getByRole('textbox', { name: 'Wrong' })).hasAttribute('data-invalid')).toBe(
      true,
    )
    expect(rootOf(screen.getByRole('textbox', { name: 'Right' })).hasAttribute('data-invalid')).toBe(
      false,
    )
  })
  it('disables the whole root when the input is disabled', () => {
    render(<Input aria-label="Plate" disabled />)
    const input = screen.getByRole('textbox')
    expect(input.hasAttribute('disabled')).toBe(true)
    expect(rootOf(input).hasAttribute('data-disabled')).toBe(true)
  })
  it('hands its ref to the input, so a form library can focus and read it', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} aria-label="Plate" />)
    expect(ref.current).toBe(screen.getByRole('textbox'))
  })
  it('renders the child element as the root with asChild, with the input and items inside it', () => {
    render(
      <Input asChild aria-label="Plate" startItem={SEARCH} className={{ root: 'field' }}>
        <div className="group" />
      </Input>,
    )
    const input = screen.getByRole('textbox', { name: 'Plate' })
    const root = rootOf(input)
    expect(root.tagName).toBe('DIV')
    expect(root.getAttribute('class')?.split(' ').sort()).toEqual(['field', 'group'])
    expect(root.firstElementChild?.getAttribute('data-slot')).toBe('input-start-item')
  })
  it('reads a variable a wrapper sets, the way a theme maps the input', () => {
    render(
      <div style={THEME}>
        <Input aria-label="Plate" aria-invalid />
      </div>,
    )
    const root = rootOf(screen.getByRole('textbox'))
    expect(getComputedStyle(root).getPropertyValue('--input-border-color--invalid')).toBe(
      'rgb(1, 2, 3)',
    )
  })
})
