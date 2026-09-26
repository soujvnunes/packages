import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
/** The default a destructuring or parameter pattern gives a binding (`{ format = fallback }`), or `null` when it has none. */
export const patternDefault = (name: TSESTree.Node) => {
  const { parent } = name
  return parent?.type === AST_NODE_TYPES.AssignmentPattern && parent.left === name ? parent.right : null
}
