import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Icon, type IconNode } from './Icon'
import { INPUT_KINDS, INPUT_SIZES, Input } from './Input'
const STYLESHEET = readFileSync(`${import.meta.dirname}/styles/input.css`, 'utf8').replace(/\s/g, '')
const SEARCH = <svg viewBox="0 0 24 24" />
const SEARCH_NODE: IconNode = [['circle', { cx: '11', cy: '11', r: '7', key: 'lens' }]]
const selectorWith = (declaration: string) => {
  const selector = STYLESHEET.split('}')
    .find((chunk) => chunk.includes(declaration))
    ?.split('{')
    .at(-2)
  if (!selector) throw new Error(`No rule of the stylesheet holds ${declaration}.`)
  return selector
}
const INPUT_PADDING = { sm: 12, md: 16, lg: 24 } as const
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
  it.each([false, true, ''])(
    'renders no item slot for an item of %j, which React renders as nothing',
    (item) => {
      const { container } = render(<Input aria-label="Search" startItem={item} endItem={item} />)
      expect(container.querySelector('[data-slot$="-item"]')).toBeNull()
    },
  )
  it.each(INPUT_SIZES)(
    'hands the %s content size to an Icon left at its default size, so the icon stays two steps below the height',
    (size) => {
      render(<Input aria-label="Search" size={size} startItem={<Icon iconNode={SEARCH_NODE} />} />)
      const root = rootOf(screen.getByRole('textbox', { name: 'Search' }))
      expect(root.querySelector('[data-slot="icon"]')?.getAttribute('data-size')).toBe('md')
      expect(root.matches(selectorWith(`--icon-md-size:var(--input-${size}-content-size,`))).toBe(true)
    },
  )
  it.each(INPUT_SIZES)(
    'pads the %s root inline two steps below its height and draws it as a pill, as the button does',
    (size) => {
      render(<Input aria-label="Plate" size={size} />)
      const root = rootOf(screen.getByRole('textbox'))
      const px = `var(--input-${size}-px,calc(var(--spacing)*${INPUT_PADDING[size]}))`
      expect(root.matches(selectorWith(`padding-inline:${px};`))).toBe(true)
      expect(root.matches(selectorWith(`border-radius:var(--input-${size}-radius,9999px);`))).toBe(true)
      expect(
        root.matches(
          selectorWith(`--ui-inner-radius-40:max(0px,var(--input-${size}-radius,9999px)-${px});`),
        ),
      ).toBe(true)
    },
  )
  it('reads no container radius, so a pill input stays a pill inside a bar or a card', () => {
    expect(STYLESHEET).not.toContain('--ui-inner-radius-64')
    expect(STYLESHEET).not.toContain('--ui-inner-radius-card')
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
  it('falls the invalid and disabled outlines back to the focus colour, so a focused invalid field keeps its ring', () => {
    expect(STYLESHEET).toContain(
      'outline-color:var(--input-outline-color--invalid,var(--input-outline-color--focus,',
    )
    expect(STYLESHEET).toContain(
      'outline-color:var(--input-outline-color--disabled,var(--input-outline-color--focus,',
    )
  })
  it('applies the hover colours only where the pointer can hover, so a tap leaves no stuck hover', () => {
    expect(STYLESHEET).toContain(
      "@media(hover:hover){[data-slot='input']:where(:not([data-disabled]):hover)",
    )
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
