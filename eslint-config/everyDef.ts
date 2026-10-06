import type { TSESLint } from '@typescript-eslint/utils'
export const everyDef = (
  variable: TSESLint.Scope.Variable | null,
  test: (def: TSESLint.Scope.Definition) => boolean,
) => !!variable && variable.defs.length > 0 && variable.defs.every(test)
