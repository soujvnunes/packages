import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
/** The name a call's callee ends in (`use` in `React.use`), or an empty string for a computed or anonymous callee. */
export const calleeName = (callee: TSESTree.Node) => {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  )
    return callee.property.name
  return ''
}
