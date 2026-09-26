import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { calleeName } from './calleeName'
const WRAPPERS = new Set(['memo', 'forwardRef'])
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
])
/** Whether an initializer is a component: a function, through any `memo`, `forwardRef`, `as` or `satisfies` around it. */
export const isComponentInit = (init: TSESTree.Node | null): boolean => {
  if (!init) return false
  if (FUNCTIONS.has(init.type)) return true
  if (init.type === AST_NODE_TYPES.CallExpression)
    return WRAPPERS.has(calleeName(init.callee) ?? '') && isComponentInit(init.arguments[0] ?? null)
  if (init.type === AST_NODE_TYPES.TSAsExpression || init.type === AST_NODE_TYPES.TSSatisfiesExpression)
    return isComponentInit(init.expression)
  return false
}
