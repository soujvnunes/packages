// Dev-only trace log: prints in `next dev` (or any dev run) so async pipeline progress is visible in the terminal as it runs, without shipping noise to production. No-op when NODE_ENV !== development. Pass a `scope` tag so interleaved parallel work stays readable.
export const devLog = (scope: string, ...args: unknown[]) => {
  // eslint-disable-next-line no-console -- the one sanctioned console.log: a dev-only trace helper.
  if (process.env.NODE_ENV === 'development') console.log(`[${scope}]`, ...args)
}
