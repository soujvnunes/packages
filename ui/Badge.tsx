import { forwardRef } from 'react'
import { createSlot, createSlottable } from '@radix-ui/react-slot'
type BadgeProps = React.ComponentPropsWithoutRef<'span'> & {
  startItem?: React.ReactNode
  asChild?: boolean
}
const BadgeSlot = createSlot<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>('Badge')
const BadgeSlottable = createSlottable('Badge')
const rendersNothing = (item: React.ReactNode) =>
  item === undefined || item === null || typeof item === 'boolean' || item === ''
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ startItem, asChild = false, children, ...rest }, ref) => {
    const start = rendersNothing(startItem) ? null : (
      <span data-slot="badge-start-item" aria-hidden>
        {startItem}
      </span>
    )
    if (asChild) {
      return (
        <BadgeSlot ref={ref} {...rest} data-slot="badge">
          {start}
          <BadgeSlottable>{children}</BadgeSlottable>
        </BadgeSlot>
      )
    }
    return (
      <span ref={ref} {...rest} data-slot="badge">
        {start}
        {children}
      </span>
    )
  },
)
