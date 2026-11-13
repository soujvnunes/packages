import { forwardRef, useId } from 'react'
import { createSlot, createSlottable } from '@radix-ui/react-slot'
type FieldControl = {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}
type FieldProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  startItem?: React.ReactNode
  endItem?: React.ReactNode
  asChild?: boolean
  children: (control: FieldControl) => React.ReactNode
}
const FieldSlot = createSlot<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>('Field')
const FieldSlottable = createSlottable('Field')
const rendersNothing = (item: React.ReactNode) =>
  item === undefined || item === null || typeof item === 'boolean' || item === ''
const itemOf = (slot: string, item: React.ReactNode) =>
  rendersNothing(item) ? null : <span data-slot={slot}>{item}</span>
export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ label, hint, error, startItem, endItem, asChild = false, children, ...rest }, ref) => {
    const id = useId()
    const invalid = !rendersNothing(error)
    const messageSlot = invalid ? 'field-error' : 'field-hint'
    const messageId = `${id}-${messageSlot}`
    const message = invalid ? error : hint
    const showsMessage = !rendersNothing(message)
    const control: FieldControl = {
      id: `${id}-control`,
      'aria-describedby': showsMessage ? messageId : undefined,
      'aria-invalid': invalid || undefined,
    }
    const rootProps = { 'data-slot': 'field', ...(invalid && { 'data-invalid': true }) }
    const partsAround = (controlNode: React.ReactNode) => (
      <>
        <label data-slot="field-label" htmlFor={control.id}>
          {label}
        </label>
        {itemOf('field-start-item', startItem)}
        {controlNode}
        {itemOf('field-end-item', endItem)}
        {showsMessage ? (
          <div data-slot={messageSlot} id={messageId}>
            {message}
          </div>
        ) : null}
      </>
    )
    if (asChild) {
      return (
        <FieldSlot ref={ref} {...rest} {...rootProps}>
          <FieldSlottable child={children(control)}>{partsAround}</FieldSlottable>
        </FieldSlot>
      )
    }
    return (
      <div ref={ref} {...rest} {...rootProps}>
        {partsAround(children(control))}
      </div>
    )
  },
)
