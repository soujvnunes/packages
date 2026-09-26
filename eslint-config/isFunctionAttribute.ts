const HANDLER = /^on[A-Z]/u
const FUNCTION_ATTRIBUTES = new Set(['ref', 'action', 'formAction'])
/** Whether a tag attribute takes a function: an event handler, a callback ref, or a form action. */
export const isFunctionAttribute = (key: string) => HANDLER.test(key) || FUNCTION_ATTRIBUTES.has(key)
