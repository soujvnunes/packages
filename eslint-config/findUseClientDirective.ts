import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
export const findUseClientDirective = (program: TSESTree.Program) => {
  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ExpressionStatement || statement.directive === undefined)
      return null
    if (statement.directive === 'use client') return statement
  }
  return null
}
