import type { SourceCode } from 'eslint'
type Statement = SourceCode['ast']['body'][number]
/** The module's `'use client'` directive statement, or `null` when the module has none. */
export const useClientDirective = (sourceCode: SourceCode): Statement | null => {
  for (const statement of sourceCode.ast.body) {
    if (statement.type !== 'ExpressionStatement' || !('directive' in statement)) return null
    if (statement.directive === 'use client') return statement
  }
  return null
}
