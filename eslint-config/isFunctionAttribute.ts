import { isEventHandler } from './isEventHandler'
const FUNCTION_ATTRIBUTES = new Set(['ref', 'action', 'formAction'])
/** Whether a tag attribute takes a function: an event handler, a callback ref, or a form action. */
export const isFunctionAttribute = (key: string) => isEventHandler(key) || FUNCTION_ATTRIBUTES.has(key)
