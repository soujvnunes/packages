import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
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
afterEach(cleanup)
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
  it('passes className and the remaining svg props through to the root', () => {
    const { container } = render(<ProductIcon name="check" className="text-main" strokeWidth={1.5} />)
    const root = rootOf(container)
    expect(root.getAttribute('class')).toBe('text-main')
    expect(root.getAttribute('stroke-width')).toBe('1.5')
  })
  it('keys each node by its own key, and a node that carries none by its attributes', () => {
    const keysOf = (iconNode: IconNode) =>
      (Icon({ iconNode }).props as { children: React.ReactElement[] }).children.map((node) => node.key)
    expect(keysOf(NODES.plus)).toEqual(['across', 'down'])
    expect(
      keysOf([
        ['circle', { cx: '12', cy: '12', r: '10' }],
        ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
      ]),
    ).toEqual(['{"cx":"12","cy":"12","r":"10"}', '{"x1":"12","x2":"12","y1":"8","y2":"12"}'])
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
