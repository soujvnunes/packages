/** Whether an attribute name is an event handler (`onClick`). */
export const isEventHandler = (key: string) => /^on[A-Z]/u.test(key)
