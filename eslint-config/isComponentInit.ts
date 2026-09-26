import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { isComponentName } from './isComponentName'
import { isComponentWrapperCall } from './isComponentWrapperCall'
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
])
/** Whether an initializer is a component: a function, or `memo`/`forwardRef` over a function or a PascalCase binding, through any `as` or `satisfies`. */
export const isComponentInit = (init: TSESTree.Node | null): boolean => {
  if (!init) return false
  if (FUNCTIONS.has(init.type)) return true
  if (isComponentWrapperCall(init)) {
    const [inner] = init.arguments
    if (inner?.type === AST_NODE_TYPES.Identifier) return isComponentName(inner.name)
    return isComponentInit(inner ?? null)
  }
  if (init.type === AST_NODE_TYPES.TSAsExpression || init.type === AST_NODE_TYPES.TSSatisfiesExpression)
    return isComponentInit(init.expression)
  return false
}
