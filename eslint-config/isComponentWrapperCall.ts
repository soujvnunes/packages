import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { calleeName } from './calleeName'
const WRAPPERS = new Set(['memo', 'forwardRef'])
export const isComponentWrapperCall = (node: TSESTree.Node): node is TSESTree.CallExpression =>
  node.type === AST_NODE_TYPES.CallExpression && WRAPPERS.has(calleeName(node.callee))
