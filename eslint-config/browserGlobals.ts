import globals from 'globals'
export const BROWSER_GLOBALS = new Set([
  ...Object.keys(globals.browser).filter(
    (name) => !Object.hasOwn(globals.node, name) && !Object.hasOwn(globals.builtin, name),
  ),
  'navigator',
  'localStorage',
  'sessionStorage',
])
