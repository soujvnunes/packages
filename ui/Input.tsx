import { forwardRef } from 'react'
import { createSlot, createSlottable } from '@radix-ui/react-slot'
export const INPUT_KINDS = ['text', 'fullWidth'] as const
export const INPUT_SIZES = ['sm', 'md', 'lg'] as const
type InputKind = (typeof INPUT_KINDS)[number]
type InputSize = (typeof INPUT_SIZES)[number]
type InputProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'size' | 'className' | 'children'> & {
  kind?: InputKind
  size?: InputSize
  startItem?: React.ReactNode
  endItem?: React.ReactNode
  className?: { root?: string; input?: string }
  asChild?: boolean
  children?: React.ReactElement
}
const InputSlot = createSlot<HTMLLabelElement, React.ComponentPropsWithoutRef<'label'>>('Input')
const InputSlottable = createSlottable('Input')
const isInvalid = (value: React.AriaAttributes['aria-invalid']) =>
  value !== undefined && value !== false && value !== 'false'
const itemOf = (slot: string, item: React.ReactNode) =>
  item === undefined || item === null ? null : (
    <span data-slot={slot} aria-hidden>
      {item}
    </span>
  )
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { kind = 'text', size = 'md', startItem, endItem, asChild = false, className, children, ...rest },
    ref,
  ) => {
    const rootProps = {
      className: className?.root,
      'data-slot': 'input',
      'data-kind': kind,
      'data-size': size,
      ...(isInvalid(rest['aria-invalid']) && { 'data-invalid': true }),
      ...(rest.disabled && { 'data-disabled': true }),
    }
    const start = itemOf('input-start-item', startItem)
    const end = itemOf('input-end-item', endItem)
    const control = <input ref={ref} {...rest} className={className?.input} data-slot="input-control" />
    if (asChild) {
      return (
        <InputSlot {...rootProps}>
          {start}
          <InputSlottable>{children}</InputSlottable>
          {control}
          {end}
        </InputSlot>
      )
    }
    return (
      <label {...rootProps}>
        {start}
        {control}
        {end}
      </label>
    )
  },
)
