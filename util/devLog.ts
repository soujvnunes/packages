export const devLog = (scope: string, ...args: unknown[]) => {
  // eslint-disable-next-line no-console -- the one sanctioned console.log: a dev-only trace helper.
  if (process.env.NODE_ENV === 'development') console.log(`[${scope}]`, ...args)
}
