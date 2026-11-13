'use client'
import { forwardRef, useContext } from 'react'
import { CardContext } from './CardContext.js'
type CardTitleOwnProps = Omit<React.ComponentPropsWithoutRef<'h2'>, 'children'>
type CardTitleRenderProps = CardTitleOwnProps & { 'data-slot': 'card-title' }
type CardTitleProps = CardTitleOwnProps & {
  children: React.ReactNode | ((props: CardTitleRenderProps) => React.ReactNode)
}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, ...rest }, ref) => {
    const { titleId } = useContext(CardContext)
    const props: CardTitleRenderProps = {
      ...rest,
      ...(titleId !== '' && { id: titleId }),
      'data-slot': 'card-title',
    }
    if (typeof children === 'function') {
      return children(props)
    }
    return (
      <h2 ref={ref} {...props}>
        {children}
      </h2>
    )
  },
)
