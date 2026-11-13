'use client'
import { forwardRef, useEffect, useId, useMemo } from 'react'
import { createSlot } from '@radix-ui/react-slot'
import { CardContext } from './CardContext.js'
type CardProps = React.ComponentPropsWithoutRef<'article'> & { asChild?: boolean }
const CardSlot = createSlot<HTMLElement, React.ComponentPropsWithoutRef<'article'>>('Card')
export const Card = forwardRef<HTMLElement, CardProps>(({ asChild = false, ...rest }, ref) => {
  const id = useId()
  const ids = useMemo(() => ({ titleId: `${id}-title`, descriptionId: `${id}-description` }), [id])
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const missing = (
      [
        ['CardTitle', ids.titleId],
        ['CardDescription', ids.descriptionId],
      ] as const
    )
      .filter(([, partId]) => document.getElementById(partId) === null)
      .map(([part]) => part)
    if (missing.length > 0) {
      console.error(
        `A Card needs a CardTitle and a CardDescription inside it, and this one has no ${missing.join(' and no ')}.`,
      )
    }
  }, [ids])
  const rootProps = {
    'aria-labelledby': ids.titleId,
    'aria-describedby': ids.descriptionId,
    'data-slot': 'card',
  }
  return (
    <CardContext.Provider value={ids}>
      {asChild ? (
        <CardSlot ref={ref} {...rest} {...rootProps} />
      ) : (
        <article ref={ref} {...rest} {...rootProps} />
      )}
    </CardContext.Provider>
  )
})
