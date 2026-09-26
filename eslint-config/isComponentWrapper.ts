import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { isComponentWrapperCall } from './isComponentWrapperCall'
/** Whether a node wraps a component without changing what it is: `memo`, `forwardRef`, `as` or `satisfies`. */
export const isComponentWrapper = (node: TSESTree.Node) =>
  isComponentWrapperCall(node) ||
  node.type === AST_NODE_TYPES.TSAsExpression ||
  node.type === AST_NODE_TYPES.TSSatisfiesExpression
