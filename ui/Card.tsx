'use client'
import { forwardRef, useEffect, useId, useMemo } from 'react'
import { CardContext } from './CardContext.js'
type CardOwnProps = Omit<React.ComponentPropsWithoutRef<'article'>, 'children'>
type CardRenderProps = CardOwnProps & {
  ref?: React.ForwardedRef<HTMLElement>
  'aria-labelledby': string
  'aria-describedby': string
  'data-slot': 'card'
}
type CardProps = CardOwnProps & {
  children?: React.ReactNode | ((props: CardRenderProps) => React.ReactNode)
}
export const Card = forwardRef<HTMLElement, CardProps>(({ children, ...rest }, ref) => {
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
  const props: CardRenderProps = {
    ...rest,
    ...(ref !== null && { ref }),
    'aria-labelledby': ids.titleId,
    'aria-describedby': ids.descriptionId,
    'data-slot': 'card',
  }
  return (
    <CardContext.Provider value={ids}>
      {typeof children === 'function' ? children(props) : <article {...props}>{children}</article>}
    </CardContext.Provider>
  )
})
