import { isEventHandler } from './isEventHandler'
const FUNCTION_ATTRIBUTES = new Set(['ref', 'action', 'formAction'])
export const isFunctionAttribute = (key: string) => isEventHandler(key) || FUNCTION_ATTRIBUTES.has(key)
