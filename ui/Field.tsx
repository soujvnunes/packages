import { forwardRef, isValidElement, useId } from 'react'
import { createSlot, createSlottable } from '@radix-ui/react-slot'
type FieldControlProps = Pick<
  React.ComponentPropsWithoutRef<'input'>,
  'id' | 'aria-describedby' | 'aria-invalid'
>
type FieldProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  startItem?: React.ReactNode
  endItem?: React.ReactNode
} & (
    | { asChild?: false; children: React.ReactElement<FieldControlProps> }
    | { asChild: true; children: React.ReactElement<{ children?: React.ReactNode }> }
  )
const FieldSlot = createSlot<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>('Field')
const FieldSlottable = createSlottable('Field')
const FieldControlSlot = createSlot<HTMLElement, FieldControlProps>('FieldControl')
const shows = (node: React.ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== ''
const itemOf = (slot: string, item: React.ReactNode) =>
  shows(item) ? <span data-slot={slot}>{item}</span> : null
export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ label, hint, error, startItem, endItem, asChild = false, children, ...rest }, ref) => {
    const id = useId()
    const invalid = shows(error)
    const messageSlot = invalid ? 'field-error' : 'field-hint'
    const messageId = `${id}-${messageSlot}`
    const message = invalid ? error : hint
    const rootProps = { 'data-slot': 'field', ...(invalid && { 'data-invalid': true }) }
    const partsAround = (control: React.ReactNode) => {
      const ownId = isValidElement<FieldControlProps>(control) ? control.props.id : undefined
      const controlId = ownId ?? `${id}-control`
      return (
        <>
          <label data-slot="field-label" htmlFor={controlId}>
            {label}
          </label>
          {itemOf('field-start-item', startItem)}
          <FieldControlSlot
            id={controlId}
            aria-describedby={shows(message) ? messageId : undefined}
            aria-invalid={invalid || undefined}>
            {control}
          </FieldControlSlot>
          {itemOf('field-end-item', endItem)}
          {shows(message) ? (
            <div data-slot={messageSlot} id={messageId}>
              {message}
            </div>
          ) : null}
        </>
      )
    }
    if (asChild) {
      return (
        <FieldSlot ref={ref} {...rest} {...rootProps}>
          <FieldSlottable child={children}>{partsAround}</FieldSlottable>
        </FieldSlot>
      )
    }
    return (
      <div ref={ref} {...rest} {...rootProps}>
        {partsAround(children)}
      </div>
    )
  },
)
