import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
/** Whether a node is a function, whose body runs only when it is called. */
export const isFunctionNode = (node: TSESTree.Node) =>
  node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionDeclaration
