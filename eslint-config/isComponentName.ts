/** Whether a binding name reads as a React component: PascalCase. */
export const isComponentName = (name: string | undefined) => !!name && /^[A-Z]/u.test(name)
