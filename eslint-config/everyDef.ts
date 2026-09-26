import type { TSESLint } from '@typescript-eslint/utils'
/** Whether a binding exists, has at least one definition, and every definition passes the test. */
export const everyDef = (
  variable: TSESLint.Scope.Variable | null,
  test: (def: TSESLint.Scope.Definition) => boolean,
) => !!variable && variable.defs.length > 0 && variable.defs.every(test)
