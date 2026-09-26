import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { calleeName } from './calleeName'
const COMPONENT = /^[A-Z]/u
const WRAPPERS = new Set(['memo', 'forwardRef'])
const MODULE_LEVEL = new Set<string>([
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExportDefaultDeclaration,
])
const isWrapper = (node: TSESTree.Node) =>
  (node.type === AST_NODE_TYPES.CallExpression && WRAPPERS.has(calleeName(node.callee) ?? '')) ||
  node.type === AST_NODE_TYPES.TSAsExpression ||
  node.type === AST_NODE_TYPES.TSSatisfiesExpression
/** Whether a function is a component React renders: declared at module level under a PascalCase name or as the default export, through any `memo`, `forwardRef`, `as` or `satisfies` around it. */
export const isComponentFunction = (node: TSESTree.Node) => {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration)
    return (
      MODULE_LEVEL.has(node.parent.type) &&
      (node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
        COMPONENT.test(node.id?.name ?? ''))
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
    COMPONENT.test(holder.id.name) &&
    MODULE_LEVEL.has(holder.parent.parent?.type ?? '')
  )
}
