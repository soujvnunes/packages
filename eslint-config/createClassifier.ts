import { ASTUtils, AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils'
import { isComponentFunction } from './isComponentFunction'
import { isNamespaceImport } from './isNamespaceImport'
type Variable = TSESLint.Scope.Variable
type Position = 'text' | 'prop'
type Verdict = { data: boolean; stable: boolean }
const { DefinitionType, ScopeType } = TSESLint.Scope
const MODULE_SCOPES = new Set<string>([ScopeType.module, ScopeType.global])
const ALWAYS: Verdict = { data: true, stable: true }
const NEVER: Verdict = { data: false, stable: false }
const both = (left: Verdict, right: Verdict) => ({
  data: left.data && right.data,
  stable: left.stable && right.stable,
})
const all = (verdicts: Verdict[]) => verdicts.reduce(both, ALWAYS)
/** Classifies a JSX value by position: `data` when a server parent could pass it, `stable` when the server would hold the same value. */
export const createClassifier = (
  sourceCode: Readonly<TSESLint.SourceCode>,
  importMembersAreData: boolean,
) => {
  const variableOf = (node: TSESTree.Node, name: string) =>
    ASTUtils.findVariable(sourceCode.getScope(node), name)
  const memo = new Map<Variable, Verdict>()
  const resolving = new Set<Variable>()
  let cycled = false
  const ofParameter = (def: TSESLint.Scope.Definitions.ParameterDefinition) => {
    if (!isComponentFunction(def.node)) return NEVER
    const { parent } = def.name
    // A prop default is created by the component itself, so it is data only when its value is.
    const fallback =
      parent.type === AST_NODE_TYPES.AssignmentPattern && parent.left === def.name
        ? classify(parent.right, 'prop').data
        : true
    return { data: fallback, stable: false }
  }
  const ofBinding = (variable: Variable): Verdict => {
    const cached = memo.get(variable)
    if (cached) return cached
    if (resolving.has(variable)) {
      cycled = true
      return NEVER
    }
    const outermost = resolving.size === 0
    if (outermost) cycled = false
    resolving.add(variable)
    const verdict = all(
      variable.defs.map((def) => {
        if (def.type === DefinitionType.Parameter) return ofParameter(def)
        if (def.type === DefinitionType.FunctionName || def.type === DefinitionType.ClassName)
          return { data: false, stable: true }
        if (def.type !== DefinitionType.Variable || !def.node.init) return NEVER
        const init = classify(def.node.init, 'prop')
        return {
          data: init.data,
          stable: init.stable && MODULE_SCOPES.has(variable.scope.type) && def.parent.kind === 'const',
        }
      }),
    )
    resolving.delete(variable)
    // Only an outermost result that met no cycle is final, since a cycle answers `never` for the binding it re-entered.
    if (outermost && !cycled) memo.set(variable, verdict)
    return verdict
  }
  // An import holds the same value on the server. A child or intrinsic attribute can only hold data, so any import there is; elsewhere a bare import or a namespace member may be a function, and a read through a named import (a copy dictionary) is data only under `importMembersAreData`.
  const ofImport = (position: Position, isDictionaryRead: boolean) => ({
    data: position === 'text' || (isDictionaryRead && importMembersAreData),
    stable: true,
  })
  const ofIdentifier = (
    node: TSESTree.Identifier,
    position: Position,
    isMemberRead: boolean,
  ): Verdict => {
    if (node.name === 'undefined') return ALWAYS
    const variable = variableOf(node, node.name)
    if (!variable || variable.defs.length === 0) return NEVER
    if (variable.defs.every((def) => def.type === DefinitionType.ImportBinding))
      return ofImport(position, isMemberRead && !isNamespaceImport(variable))
    return ofBinding(variable)
  }
  const classify = (node: TSESTree.Node | null, position: Position): Verdict => {
    if (!node) return NEVER
    switch (node.type) {
      case AST_NODE_TYPES.Literal:
      case AST_NODE_TYPES.JSXEmptyExpression:
        return ALWAYS
      case AST_NODE_TYPES.TemplateLiteral:
        return {
          data: true,
          stable: all(node.expressions.map((part) => classify(part, position))).stable,
        }
      case AST_NODE_TYPES.UnaryExpression:
        return { data: true, stable: classify(node.argument, position).stable }
      case AST_NODE_TYPES.BinaryExpression:
        return {
          data: true,
          stable: both(classify(node.left, position), classify(node.right, position)).stable,
        }
      case AST_NODE_TYPES.LogicalExpression:
        return both(classify(node.left, position), classify(node.right, position))
      case AST_NODE_TYPES.ConditionalExpression: {
        const branches = both(classify(node.consequent, position), classify(node.alternate, position))
        return { data: branches.data, stable: branches.stable && classify(node.test, position).stable }
      }
      case AST_NODE_TYPES.ArrayExpression:
        return all(
          node.elements.map((element) => {
            if (!element) return ALWAYS
            return classify(
              element.type === AST_NODE_TYPES.SpreadElement ? element.argument : element,
              position,
            )
          }),
        )
      case AST_NODE_TYPES.ObjectExpression:
        return all(
          node.properties.map((property) => {
            if (property.type === AST_NODE_TYPES.SpreadElement)
              return classify(property.argument, position)
            if (property.kind !== 'init' || property.method) return NEVER
            const value = classify(property.value, position)
            return property.computed ? both(value, classify(property.key, position)) : value
          }),
        )
      case AST_NODE_TYPES.MemberExpression: {
        const key = node.computed ? classify(node.property, position) : ALWAYS
        const object =
          node.object.type === AST_NODE_TYPES.Identifier
            ? ofIdentifier(node.object, position, true)
            : classify(node.object, position)
        return both(object, key)
      }
      case AST_NODE_TYPES.ChainExpression:
      case AST_NODE_TYPES.TSAsExpression:
      case AST_NODE_TYPES.TSSatisfiesExpression:
      case AST_NODE_TYPES.TSNonNullExpression:
        return classify(node.expression, position)
      case AST_NODE_TYPES.JSXElement:
      case AST_NODE_TYPES.JSXFragment:
        return { data: true, stable: false }
      case AST_NODE_TYPES.Identifier:
        return ofIdentifier(node, position, false)
      default:
        return NEVER
    }
  }
  return classify
}
