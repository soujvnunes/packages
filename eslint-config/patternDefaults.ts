import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
/** Every default a destructuring or parameter pattern can give a binding, its own and each enclosing pattern's (`{ options: { format } = fallback }`). */
export const patternDefaults = (name: TSESTree.Node) => {
  const defaults: TSESTree.Node[] = []
  let current = name
  while (current.parent) {
    const { parent } = current
    if (parent.type === AST_NODE_TYPES.AssignmentPattern && parent.left === current)
      defaults.push(parent.right)
    else if (parent.type === AST_NODE_TYPES.Property && parent.value === current) {
      if (parent.parent.type !== AST_NODE_TYPES.ObjectPattern) break
      current = parent.parent
      continue
    } else if (
      parent.type !== AST_NODE_TYPES.ArrayPattern &&
      parent.type !== AST_NODE_TYPES.RestElement
    )
      break
    current = parent
  }
  return defaults
}
