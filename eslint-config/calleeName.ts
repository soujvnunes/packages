import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
export const calleeName = (callee: TSESTree.Node) => {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  )
    return callee.property.name
  return ''
}
