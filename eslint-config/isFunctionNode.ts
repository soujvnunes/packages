import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
])
/** Whether a node is a function, whose body runs only when it is called. */
export const isFunctionNode = (
  node: TSESTree.Node,
): node is
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration =>
  FUNCTIONS.has(node.type)
