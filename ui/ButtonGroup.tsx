import { forwardRef } from 'react'
import { createSlot } from '@radix-ui/react-slot'
export const BUTTON_GROUP_ORIENTATIONS = ['horizontal', 'vertical'] as const
type ButtonGroupOrientation = (typeof BUTTON_GROUP_ORIENTATIONS)[number]
type ButtonGroupProps = React.ComponentPropsWithoutRef<'div'> & {
  orientation?: ButtonGroupOrientation
  asChild?: boolean
}
const ButtonGroupSlot = createSlot<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>('ButtonGroup')
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = 'horizontal', asChild = false, ...rest }, ref) => {
    const rootProps = { 'data-slot': 'button-group', 'data-orientation': orientation }
    if (asChild) {
      return <ButtonGroupSlot ref={ref} {...rest} {...rootProps} />
    }
    return <div ref={ref} role="group" {...rest} {...rootProps} />
  },
)
