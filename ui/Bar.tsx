import { forwardRef } from 'react'
import { createSlot } from '@radix-ui/react-slot'
type BarProps = React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }
const BarSlot = createSlot<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>('Bar')
export const Bar = forwardRef<HTMLDivElement, BarProps>(({ asChild = false, ...rest }, ref) => {
  if (asChild) {
    return <BarSlot ref={ref} {...rest} data-slot="bar" />
  }
  return <div ref={ref} {...rest} data-slot="bar" />
})
