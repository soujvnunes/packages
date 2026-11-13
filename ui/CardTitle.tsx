'use client'
import { forwardRef, useContext } from 'react'
import { createSlot } from '@radix-ui/react-slot'
import { CardContext } from './CardContext.js'
type CardTitleProps = React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }
const CardTitleSlot = createSlot<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>('CardTitle')
export const CardTitle = forwardRef<HTMLDivElement, CardTitleProps>(
  ({ asChild = false, ...rest }, ref) => {
    const { titleId } = useContext(CardContext)
    const rootProps = { ...(titleId !== '' && { id: titleId }), 'data-slot': 'card-title' }
    if (asChild) {
      return <CardTitleSlot ref={ref} {...rest} {...rootProps} />
    }
    return <div ref={ref} {...rest} {...rootProps} />
  },
)
