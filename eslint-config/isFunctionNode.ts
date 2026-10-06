import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
export const isFunctionNode = (node: TSESTree.Node) =>
  node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionDeclaration
