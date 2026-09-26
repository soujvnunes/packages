import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { isComponentName } from './isComponentName'
import { isComponentWrapperCall } from './isComponentWrapperCall'
const MODULE_LEVEL = new Set<string>([
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExportDefaultDeclaration,
])
const isWrapper = (node: TSESTree.Node) =>
  isComponentWrapperCall(node) ||
  node.type === AST_NODE_TYPES.TSAsExpression ||
  node.type === AST_NODE_TYPES.TSSatisfiesExpression
/** Whether a function is a component React renders: declared at module level under a PascalCase name or as the default export, through any `memo`, `forwardRef`, `as` or `satisfies` around it. */
export const isComponentFunction = (node: TSESTree.Node) => {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration)
    return (
      MODULE_LEVEL.has(node.parent.type) &&
      (node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration || isComponentName(node.id?.name))
    )
  if (
    node.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    node.type !== AST_NODE_TYPES.FunctionExpression
  )
    return false
  let holder: TSESTree.Node = node.parent
  while (isWrapper(holder) && holder.parent) holder = holder.parent
  if (holder.type === AST_NODE_TYPES.ExportDefaultDeclaration) return true
  return (
    holder.type === AST_NODE_TYPES.VariableDeclarator &&
    holder.id.type === AST_NODE_TYPES.Identifier &&
    isComponentName(holder.id.name) &&
    MODULE_LEVEL.has(holder.parent.parent?.type ?? '')
  )
}
