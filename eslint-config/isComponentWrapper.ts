import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { isComponentWrapperCall } from './isComponentWrapperCall'
export const isComponentWrapper = (node: TSESTree.Node) =>
  isComponentWrapperCall(node) ||
  node.type === AST_NODE_TYPES.TSAsExpression ||
  node.type === AST_NODE_TYPES.TSSatisfiesExpression
