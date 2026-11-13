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
const INPUT_PADDING = { md: 16, lg: 24 } as const
const INPUT_RADIUS = { md: 24, lg: 40 } as const
const INPUT_INNER_RADIUS = { md: 8, lg: 16 } as const
const DECLARATIONS = readFileSync(`${import.meta.dirname}/styles/input.css`, 'utf8')
  .replace(/\s+/g, ' ')
  .replace(/\s*([(,:;{}])\s*/g, '$1')
  .replace(/\s*\)/g, ')')
const STATE_STEPS = { hover: 80, disabled: 40 } as const
const PAINT_PROPERTIES = {
  'background-color': 'background-color',
  'text-color': 'color',
  'border-color': 'border-color',
} as const
const REST_VALUES = {
  'background-color':
    'var(--input-background-color,color-mix(in oklab,var(--input-color,transparent) 20%,transparent))',
  'text-color': 'var(--input-text-color,var(--input-color))',
  'border-color':
    'var(--input-border-color,color-mix(in oklab,var(--input-color,transparent) 60%,transparent))',
} as const
const PAINTS = Object.keys(PAINT_PROPERTIES) as readonly (keyof typeof PAINT_PROPERTIES)[]
const STATE_PAINTS = { hover: ['border-color'], disabled: PAINTS } as const
const STATES = Object.keys(STATE_PAINTS) as readonly (keyof typeof STATE_PAINTS)[]
const hoverDeclarations = () => {
  const start = DECLARATIONS.indexOf(':not([data-disabled]):hover){')
  if (start === -1) throw new Error('No hover rule of the stylesheet.')
  const body = DECLARATIONS.slice(DECLARATIONS.indexOf('{', start) + 1)
  return body.slice(0, body.indexOf('}'))
}
const STATE_SELECTORS = {
  focus: "[data-slot='input']:where(:has([data-slot='input-control']:focus-visible))",
  hover: "[data-slot='input']:where(:not([data-disabled]):hover)",
  invalid: "[data-slot='input']:where([data-invalid])",
  invalidHover: "[data-slot='input']:where([data-invalid]:not([data-disabled]):hover)",
  disabled: "[data-slot='input']:where([data-disabled])",
} as const
const ruleIndex = (selector: string) => {
  const index = DECLARATIONS.indexOf(`${selector}{`)
  if (index === -1) throw new Error(`No rule of the stylesheet selects ${selector}.`)
  return index
}
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
  it('starts at md and has no sm size, since a field 24 high with 12 text cannot be typed in or touched', () => {
    expect(INPUT_SIZES).toEqual(['md', 'lg'])
    expect(STYLESHEET).not.toContain('--input-sm-')
    expect(STYLESHEET).not.toContain("[data-size='sm']")
  })
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
    'pads the %s root inline two steps below its height, reads the inner radius of a field or a card before its radius step, and publishes its radius less its padding',
    (size) => {
      render(<Input aria-label="Plate" size={size} />)
      const root = rootOf(screen.getByRole('textbox'))
      const px = `var(--input-${size}-px,calc(var(--spacing)*${INPUT_PADDING[size]}))`
      const radius = `var(--ui-inner-radius-64,var(--ui-inner-radius-card,var(--input-${size}-radius,var(--radius-${INPUT_RADIUS[size]}))))`
      expect(root.matches(selectorWith(`padding-inline:${px};`))).toBe(true)
      expect(root.matches(selectorWith(`border-radius:${radius};`))).toBe(true)
      expect(root.matches(selectorWith(`--ui-inner-radius-40:max(0px,${radius}-${px});`))).toBe(true)
      expect(INPUT_RADIUS[size] - INPUT_PADDING[size]).toBe(INPUT_INNER_RADIUS[size])
    },
  )
  it('takes its width from the column it sits in, never from the size attribute of the input', () => {
    render(<Input aria-label="Plate" />)
    const input = screen.getByRole('textbox')
    expect(input.matches(selectorWith('{flex:1;width:0;min-width:0;'))).toBe(true)
    expect(
      rootOf(input).matches(selectorWith('{box-sizing:border-box;display:inline-flex;min-width:0;')),
    ).toBe(true)
  })
  it('defaults the placeholder to the text colour at the 60 step, so it reads apart from a typed value, and lets the theme map it', () => {
    expect(DECLARATIONS).toContain(
      "[data-slot='input-control']::placeholder{color:var(--input-placeholder-color,color-mix(in oklab,currentColor 60%,transparent));",
    )
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
  it('orders the state rules focus, hover, invalid, invalid hover, disabled at one specificity, so hover still answers on a focused or an invalid field', () => {
    const order = Object.values(STATE_SELECTORS).map(ruleIndex)
    expect(order).toEqual([...order].sort((first, second) => first - second))
  })
  it('hovers an invalid field from its invalid border at the hover step, so the error colour stays while it answers', () => {
    render(<Input aria-label="Plate" aria-invalid />)
    const root = rootOf(screen.getByRole('textbox'))
    expect(root.matches(STATE_SELECTORS.hover.replace(':hover', ''))).toBe(true)
    expect(root.matches(STATE_SELECTORS.invalidHover.replace(':hover', ''))).toBe(true)
    expect(DECLARATIONS).toContain(
      `${STATE_SELECTORS.invalidHover}{border-color:color-mix(in oklab,var(--input-border-color--invalid,${REST_VALUES['border-color']}) 80%,transparent);}`,
    )
  })
  it('moves only the border on hover, so the typed text, the fill and the focus ring keep their value', () => {
    const hover = hoverDeclarations()
    expect(hover.startsWith('border-color:var(--input-border-color--hover,')).toBe(true)
    expect(hover).not.toContain(';color:')
    expect(hover).not.toContain('background-color:')
    expect(hover).not.toContain('outline-color:')
  })
  it.each(STATES.flatMap((state) => STATE_PAINTS[state].map((paint) => [state, paint] as const)))(
    'reads the %s %s the theme maps first, and otherwise its rest value at the step of that state',
    (state, paint) => {
      expect(DECLARATIONS).toContain(
        `${PAINT_PROPERTIES[paint]}:var(--input-${paint}--${state},color-mix(in oklab,${REST_VALUES[paint]} ${STATE_STEPS[state]}%,transparent));`,
      )
    },
  )
  it.each(PAINTS)(
    'paints the %s from the one colour --input-color unless the theme maps it, the text as is, the background at 20 and the border at 60',
    (paint) => {
      expect(DECLARATIONS).toContain(`;${PAINT_PROPERTIES[paint]}:${REST_VALUES[paint]};`)
    },
  )
  it.each(['focus', 'invalid'] as const)(
    'keeps the rest colours on %s unless the theme maps that state, so an invalid border reads the rest border until a product maps its error colour',
    (state) => {
      for (const paint of PAINTS) {
        expect(DECLARATIONS).toContain(
          `${PAINT_PROPERTIES[paint]}:var(--input-${paint}--${state},${REST_VALUES[paint]});`,
        )
      }
    },
  )
  it('gives the one colour no state, since each state of the text reads --input-text-color', () => {
    expect(STYLESHEET).not.toContain('--input-color--')
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
