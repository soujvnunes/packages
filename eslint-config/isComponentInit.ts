import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import { isComponentName } from './isComponentName'
import { isComponentWrapper } from './isComponentWrapper'
import { isFunctionNode } from './isFunctionNode'
/** Whether an initializer is a component: a function, or `memo`/`forwardRef` over a function or a PascalCase binding, through any `as` or `satisfies`. */
export const isComponentInit = (init: TSESTree.Node | null): boolean => {
  if (!init) return false
  if (isFunctionNode(init)) return true
  if (!isComponentWrapper(init)) return false
  if (init.type !== AST_NODE_TYPES.CallExpression) return isComponentInit(init.expression)
  const [inner] = init.arguments
  if (inner?.type === AST_NODE_TYPES.Identifier) return isComponentName(inner.name)
  return isComponentInit(inner ?? null)
}
