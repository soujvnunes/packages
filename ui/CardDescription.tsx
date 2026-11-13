'use client'
import { forwardRef, useContext } from 'react'
import { CardContext } from './CardContext.js'
type CardDescriptionOwnProps = Omit<React.ComponentPropsWithoutRef<'p'>, 'children'>
type CardDescriptionRenderProps = CardDescriptionOwnProps & {
  ref?: React.ForwardedRef<HTMLParagraphElement>
  'data-slot': 'card-description'
}
type CardDescriptionProps = CardDescriptionOwnProps & {
  children: React.ReactNode | ((props: CardDescriptionRenderProps) => React.ReactNode)
}
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, ...rest }, ref) => {
    const { descriptionId } = useContext(CardContext)
    const props: CardDescriptionRenderProps = {
      ...rest,
      ...(ref !== null && { ref }),
      ...(descriptionId !== '' && { id: descriptionId }),
      'data-slot': 'card-description',
    }
    if (typeof children === 'function') {
      return children(props)
    }
    return <p {...props}>{children}</p>
  },
)
