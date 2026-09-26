import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
const COMPONENT = /^[A-Z]/u
const WRAPPERS = new Set(['memo', 'forwardRef'])
const MODULE_LEVEL = new Set<string>([
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExportDefaultDeclaration,
])
const wrapperName = (callee: TSESTree.Node) => {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  )
    return callee.property.name
  return ''
}
/** Whether a function is a component React renders: declared at module level under a PascalCase name or as the default export, directly or inside `memo` or `forwardRef`. */
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
  const holder =
    node.parent.type === AST_NODE_TYPES.CallExpression && WRAPPERS.has(wrapperName(node.parent.callee))
      ? node.parent.parent
      : node.parent
  if (holder.type === AST_NODE_TYPES.ExportDefaultDeclaration) return true
  return (
    holder.type === AST_NODE_TYPES.VariableDeclarator &&
    holder.id.type === AST_NODE_TYPES.Identifier &&
    COMPONENT.test(holder.id.name) &&
    MODULE_LEVEL.has(holder.parent.parent?.type ?? '')
  )
}
