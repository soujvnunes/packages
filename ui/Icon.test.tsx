import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { type MockInstance, afterEach, describe, expect, it, vi } from 'vitest'
import { ICON_SIZES, Icon, type IconNode } from './Icon'
const NODES = {
  check: [['path', { d: 'M20 6 9 17l-5-5', key: 'check' }]],
  plus: [
    ['path', { d: 'M5 12h14', key: 'across' }],
    ['path', { d: 'M12 5v14', key: 'down' }],
  ],
} satisfies Record<string, IconNode>
type ProductIconProps = Omit<React.ComponentProps<'svg'>, 'children'> & {
  name: keyof typeof NODES
  size?: (typeof ICON_SIZES)[number]
}
const ProductIcon = ({ name, ...props }: ProductIconProps) => <Icon iconNode={NODES[name]} {...props} />
const rootOf = (container: HTMLElement) => {
  const root = container.querySelector('[data-slot="icon"]')
  if (!root) throw new Error('The icon root is missing.')
  return root
}
const keyWarningsOf = (consoleError: MockInstance<typeof console.error>) =>
  consoleError.mock.calls.filter((args) => args.join(' ').includes('unique "key"'))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
describe('Icon', () => {
  it('renders the named node as the children of one svg root', () => {
    const { container } = render(<ProductIcon name="plus" />)
    const root = rootOf(container)
    expect(root.tagName).toBe('svg')
    expect([...root.querySelectorAll('path')].map((path) => path.getAttribute('d'))).toEqual([
      'M5 12h14',
      'M12 5v14',
    ])
  })
  it('defaults to the md size', () => {
    const { container } = render(<ProductIcon name="check" />)
    expect(rootOf(container).getAttribute('data-size')).toBe('md')
  })
  it.each(ICON_SIZES)(
    'carries the %s size as its data-size attribute, for the stylesheet to read',
    (size) => {
      const { container } = render(<ProductIcon name="check" size={size} />)
      expect(rootOf(container).getAttribute('data-size')).toBe(size)
    },
  )
  it('stays hidden from assistive technology when it has no label, since it only decorates', () => {
    const { container } = render(<ProductIcon name="check" />)
    expect(rootOf(container).getAttribute('aria-hidden')).toBe('true')
    expect(screen.queryByRole('img')).toBeNull()
  })
  it('is an image named by its aria-label when it carries meaning', () => {
    render(<ProductIcon name="check" aria-label="Accepted" />)
    const image = screen.getByRole('img', { name: 'Accepted' })
    expect(image.getAttribute('aria-hidden')).toBeNull()
  })
  it('is an image named by aria-labelledby, so a visible caption beside it can name it', () => {
    render(
      <>
        <span id="caption">Accepted</span>
        <ProductIcon name="check" aria-labelledby="caption" />
      </>,
    )
    const image = screen.getByRole('img', { name: 'Accepted' })
    expect(image.getAttribute('aria-hidden')).toBeNull()
  })
  it('skips a blank aria-label, so a wrapper that defaults it to an empty string keeps aria-labelledby', () => {
    render(
      <>
        <span id="caption">Accepted</span>
        <ProductIcon name="check" aria-label="" aria-labelledby="caption" />
      </>,
    )
    const image = screen.getByRole('img', { name: 'Accepted' })
    expect(image.getAttribute('aria-hidden')).toBeNull()
  })
  it('is an image named by the aria-label a product svg passed with asChild carries itself', () => {
    render(
      <Icon asChild>
        <svg viewBox="0 0 10 10" aria-label="Logo">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </Icon>,
    )
    const image = screen.getByRole('img', { name: 'Logo' })
    expect(image.getAttribute('aria-hidden')).toBeNull()
  })
  it('passes className and the remaining svg props through to the root', () => {
    const { container } = render(<ProductIcon name="check" className="text-main" strokeWidth={1.5} />)
    const root = rootOf(container)
    expect(root.getAttribute('class')).toBe('text-main')
    expect(root.getAttribute('stroke-width')).toBe('1.5')
  })
  it('hands its ref to the svg root, so a ref or a trigger wrapping the icon gets the element', () => {
    const ref = createRef<SVGSVGElement>()
    const { container } = render(<Icon ref={ref} iconNode={NODES.check} />)
    expect(ref.current).toBe(rootOf(container))
  })
  it('hands its ref to a product svg passed with asChild', () => {
    const ref = createRef<SVGSVGElement>()
    const { container } = render(
      <Icon ref={ref} asChild>
        <svg viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </Icon>,
    )
    expect(ref.current).toBe(rootOf(container))
  })
  it('keys each node by its own key, so a node keeps its element when it moves and changes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container, rerender } = render(<Icon iconNode={NODES.plus} />)
    const [across, down] = container.querySelectorAll('path')
    expect(container.querySelectorAll('svg > path')).toHaveLength(2)
    expect(keyWarningsOf(consoleError)).toEqual([])
    rerender(
      <Icon
        iconNode={[
          ['path', { d: 'M12 5v14', key: 'down' }],
          ['path', { d: 'M4 12h16', key: 'across' }],
        ]}
      />,
    )
    const moved = container.querySelectorAll('path')
    expect(moved[0]).toBe(down)
    expect(moved[1]).toBe(across)
  })
  it('keys a node that carries no key by its attributes, so it keeps its element when it moves', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const circle: IconNode[number] = ['circle', { cx: '12', cy: '12', r: '10' }]
    const line: IconNode[number] = ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }]
    const { container, rerender } = render(<Icon iconNode={[circle, line]} />)
    const root = rootOf(container)
    expect(root.querySelectorAll('circle')).toHaveLength(1)
    expect(root.querySelectorAll('line')).toHaveLength(1)
    expect(keyWarningsOf(consoleError)).toEqual([])
    const circleElement = root.querySelector('circle')
    rerender(<Icon iconNode={[line, circle]} />)
    expect(root.querySelector('circle')).toBe(circleElement)
  })
  it('gives the slot, size and accessibility attributes to a product svg passed with asChild', () => {
    render(
      <Icon asChild size="lg" aria-label="Logo" className="brand">
        <svg viewBox="0 0 10 10" className="logo">
          <circle cx="5" cy="5" r="4" />
        </svg>
      </Icon>,
    )
    const root = screen.getByRole('img', { name: 'Logo' })
    expect(root.getAttribute('data-slot')).toBe('icon')
    expect(root.getAttribute('data-size')).toBe('lg')
    expect(root.getAttribute('viewBox')).toBe('0 0 10 10')
    expect(root.getAttribute('class')?.split(' ').sort()).toEqual(['brand', 'logo'])
    expect(root.querySelector('circle')).not.toBeNull()
  })
})
