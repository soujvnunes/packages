import { createElement, forwardRef } from 'react'
import { createSlot } from '@radix-ui/react-slot'
type IconElementName = 'circle' | 'ellipse' | 'g' | 'line' | 'path' | 'polygon' | 'polyline' | 'rect'
export type IconNode = [elementName: IconElementName, attrs: Record<string, string>][]
export const ICON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
type IconSize = (typeof ICON_SIZES)[number]
type SvgProps = Omit<React.ComponentPropsWithoutRef<'svg'>, 'children'>
type AccessibleName = Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby'>
type IconProps = SvgProps & { size?: IconSize } & (
    | { asChild?: false; iconNode: IconNode; children?: never }
    | { asChild: true; iconNode?: never; children: React.ReactElement<AccessibleName> }
  )
const IconSlot = createSlot<SVGSVGElement, React.SVGProps<SVGSVGElement>>('Icon')
const nameOf = ({ 'aria-label': label, 'aria-labelledby': labelledBy }: AccessibleName) =>
  [labelledBy, label].find(Boolean)
const accessibilityOf = (name: string | undefined) => (name ? { role: 'img' } : { 'aria-hidden': true })
const renderNode = ([elementName, { key, ...attrs }]: IconNode[number]) =>
  createElement(elementName, { key: key ?? JSON.stringify(attrs), ...attrs })
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 'md', asChild, iconNode, children, ...rest }, ref) => {
    const name = [nameOf(rest), asChild ? nameOf(children.props) : undefined].find(Boolean)
    const rootProps = { ...accessibilityOf(name), 'data-slot': 'icon', 'data-size': size }
    if (asChild) {
      return (
        <IconSlot ref={ref} {...rest} {...rootProps}>
          {children}
        </IconSlot>
      )
    }
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
        {...rootProps}>
        {iconNode.map(renderNode)}
      </svg>
    )
  },
)
