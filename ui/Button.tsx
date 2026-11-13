import { Children, forwardRef, isValidElement } from 'react'
import { createSlot, createSlottable } from '@radix-ui/react-slot'
import { Badge } from './Badge.js'
export const BUTTON_KINDS = ['text', 'icon', 'fullWidth', 'card'] as const
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const
export const BUTTON_TONES = ['main', 'accent', 'success', 'warning', 'error'] as const
type ButtonKind = (typeof BUTTON_KINDS)[number]
type ButtonSize = (typeof BUTTON_SIZES)[number]
type ButtonTone = (typeof BUTTON_TONES)[number]
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  'data-tone'?: ButtonTone
  kind?: ButtonKind
  size?: ButtonSize
  startItem?: React.ReactNode
  endItem?: React.ReactNode
  asChild?: boolean
  stateful?: boolean
  responsive?: boolean
  disableContentBetween?: boolean
}
const ButtonSlot = createSlot<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>('Button')
const ButtonSlottable = createSlottable('Button')
const isOn = (value: React.AriaAttributes['aria-pressed' | 'aria-selected']) =>
  value === true || value === 'true'
const rendersNothing = (item: React.ReactNode) =>
  item === undefined || item === null || typeof item === 'boolean' || item === ''
const itemOf = (slot: string, item: React.ReactNode) =>
  rendersNothing(item) ? null : (
    <span data-slot={slot} aria-hidden>
      {item}
    </span>
  )
const marksEdge = (node: React.ReactNode, elementCount: number, contentLength: number) =>
  isValidElement(node) &&
  (typeof node.type === 'string' || node.type === Badge || (elementCount === 1 && contentLength > 1))
const elementEdgesOf = (nodes: React.ReactNode, pullStart: boolean, pullEnd: boolean) => {
  const content = Children.toArray(nodes).filter((node) => !rendersNothing(node))
  const elementCount = content.filter((node) => isValidElement(node)).length
  return [
    pullStart && marksEdge(content.at(0), elementCount, content.length) && 'start',
    pullEnd && marksEdge(content.at(-1), elementCount, content.length) && 'end',
  ]
    .filter(Boolean)
    .join(' ')
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      kind = 'text',
      size = 'md',
      startItem,
      endItem,
      asChild = false,
      stateful = false,
      responsive = true,
      disableContentBetween = false,
      type = 'button',
      children,
      ...rest
    },
    ref,
  ) => {
    const start = itemOf('button-start-item', startItem)
    const end = itemOf('button-end-item', endItem)
    const items =
      kind === 'card' && (start ?? end) ? (
        <span data-slot="button-items">
          {start}
          {end}
        </span>
      ) : null
    const stateSource =
      asChild && isValidElement<React.AriaAttributes>(children) ? { ...rest, ...children.props } : rest
    const declaresState =
      stateSource['aria-pressed'] !== undefined || stateSource['aria-selected'] !== undefined
    const leading = kind === 'card' ? items : start
    const trailing = kind === 'card' ? null : end
    const content =
      asChild && isValidElement<{ children?: React.ReactNode }>(children)
        ? children.props.children
        : children
    const elementEdges =
      kind === 'text' || kind === 'fullWidth'
        ? elementEdgesOf(content, leading === null, trailing === null)
        : ''
    const rootProps = {
      'data-slot': 'button',
      'data-kind': kind,
      'data-size': size,
      'data-responsive': responsive,
      'data-content-between': !disableContentBetween,
      ...(elementEdges && { 'data-element-edge': elementEdges }),
      ...(stateful &&
        (!asChild || declaresState) && {
          'data-state':
            isOn(stateSource['aria-pressed']) || isOn(stateSource['aria-selected'])
              ? 'active'
              : 'inactive',
        }),
    }
    if (asChild) {
      return (
        <ButtonSlot ref={ref} {...(!responsive && { tabIndex: -1 })} {...rest} {...rootProps}>
          {leading}
          <ButtonSlottable>{children}</ButtonSlottable>
          {trailing}
        </ButtonSlot>
      )
    }
    return (
      <button ref={ref} type={type} {...(!responsive && { tabIndex: -1 })} {...rest} {...rootProps}>
        {leading}
        {children}
        {trailing}
      </button>
    )
  },
)
