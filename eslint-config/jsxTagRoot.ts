import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
/** The identifier a JSX tag name starts from and how many dots follow it, or `null` for a namespaced name such as `svg:rect`. */
export const jsxTagRoot = (name: TSESTree.JSXTagNameExpression) => {
  let root: TSESTree.JSXTagNameExpression = name
  let depth = 0
  while (root.type === AST_NODE_TYPES.JSXMemberExpression) {
    root = root.object
    depth += 1
  }
  return root.type === AST_NODE_TYPES.JSXIdentifier ? { root, depth } : null
}
