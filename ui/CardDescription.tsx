'use client'
import { forwardRef, useContext } from 'react'
import { createSlot } from '@radix-ui/react-slot'
import { CardContext } from './CardContext.js'
type CardDescriptionProps = React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }
const CardDescriptionSlot = createSlot<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  'CardDescription',
)
export const CardDescription = forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ asChild = false, ...rest }, ref) => {
    const { descriptionId } = useContext(CardContext)
    const rootProps = {
      ...(descriptionId !== '' && { id: descriptionId }),
      'data-slot': 'card-description',
    }
    if (asChild) {
      return <CardDescriptionSlot ref={ref} {...rest} {...rootProps} />
    }
    return <div ref={ref} {...rest} {...rootProps} />
  },
)
