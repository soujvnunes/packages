import { ASTUtils, AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils'
import { isComponentFunction } from './isComponentFunction'
import { isComponentInit } from './isComponentInit'
import { isNamespaceImport } from './isNamespaceImport'
import { jsxTagRoot } from './jsxTagRoot'
import { patternDefault } from './patternDefault'
type Variable = TSESLint.Scope.Variable
type Position = 'text' | 'prop'
type Verdict = { data: boolean; stable: boolean }
const { DefinitionType, ScopeType } = TSESLint.Scope
const INTRINSIC = /^[a-z]/u
// A React 19 context renders as its own provider (`<SessionContext value>`), which a server component can neither create nor provide.
const PROVIDER = /(?:Context|Ctx|Provider)$/u
const MODULE_SCOPES = new Set<string>([ScopeType.module, ScopeType.global])
const LITERAL_INITS = new Set<string>([
  AST_NODE_TYPES.ArrayExpression,
  AST_NODE_TYPES.Literal,
  AST_NODE_TYPES.TemplateLiteral,
])
// Every method a string, array, number or plain object carries, so `LABEL.toUpperCase` or `ROWS.map` is a function whatever the constant holds.
const METHOD_NAMES = new Set(
  [String.prototype, Array.prototype, Number.prototype, Object.prototype].flatMap((prototype) =>
    Object.getOwnPropertyNames(prototype).filter(
      (name) => typeof Reflect.get(prototype, name) === 'function',
    ),
  ),
)
const ALWAYS: Verdict = { data: true, stable: true }
const NEVER: Verdict = { data: false, stable: false }
const PER_RENDER: Verdict = { data: true, stable: false }
const both = (left: Verdict, right: Verdict) => ({
  data: left.data && right.data,
  stable: left.stable && right.stable,
})
const all = (verdicts: Verdict[]) => verdicts.reduce(both, ALWAYS)
const keyName = (key: TSESTree.Node, computed: boolean) => {
  if (!computed && key.type === AST_NODE_TYPES.Identifier) return key.name
  if (key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string') return key.value
  return undefined
}
// A write through a member (`OPTIONS.format = fn`, `delete OPTIONS.format`), or the object handed to a call that may write it.
const isMutated = (variable: Variable) =>
  variable.references.some(({ identifier }) => {
    let current: TSESTree.Node = identifier
    while (
      current.parent?.type === AST_NODE_TYPES.MemberExpression &&
      current.parent.object === current
    )
      current = current.parent
    const { parent } = current
    if (current === identifier)
      return parent?.type === AST_NODE_TYPES.CallExpression && parent.callee !== current
    return (
      (parent?.type === AST_NODE_TYPES.AssignmentExpression && parent.left === current) ||
      parent?.type === AST_NODE_TYPES.UpdateExpression ||
      (parent?.type === AST_NODE_TYPES.UnaryExpression && parent.operator === 'delete')
    )
  })
/** Classifies JSX values and tags for both client-boundary rules: `data` when a server parent could supply it, `stable` when the server would hold the same one. */
export const createClassifier = (
  sourceCode: Readonly<TSESLint.SourceCode>,
  importMembersAreData: boolean,
) => {
  // Annotated so the declaration names the type through `@typescript-eslint/utils` rather than a pnpm path to scope-manager.
  const variableOf = (node: TSESTree.Node, name: string): Variable | null =>
    ASTUtils.findVariable(sourceCode.getScope(node), name)
  const memo = new Map<Variable, Verdict>()
  const resolving = new Set<Variable>()
  let cycled = false
  // A default is created by the module or component itself, so a binding that has one is data only when its default is.
  const withDefault = (name: TSESTree.Node, verdict: Verdict) => {
    const fallback = patternDefault(name)
    return fallback ? both(verdict, classify(fallback, 'prop')) : verdict
  }
  const isReassigned = (variable: Variable) =>
    variable.references.some((reference) => reference.isWrite() && !reference.init)
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
        if (def.type === DefinitionType.Parameter)
          return isComponentFunction(def.node) ? withDefault(def.name, PER_RENDER) : NEVER
        if (def.type === DefinitionType.FunctionName || def.type === DefinitionType.ClassName)
          return { data: false, stable: true }
        if (def.type !== DefinitionType.Variable || !def.node.init) return NEVER
        if (def.parent.kind !== 'const' && isReassigned(variable)) return NEVER
        const init = classify(def.node.init, 'prop')
        return withDefault(def.name, {
          data: init.data,
          stable: init.stable && MODULE_SCOPES.has(variable.scope.type) && def.parent.kind === 'const',
        })
      }),
    )
    resolving.delete(variable)
    // Only an outermost result that met no cycle is final, since a cycle answers `never` for the binding it re-entered.
    if (outermost && !cycled) memo.set(variable, verdict)
    return verdict
  }
  // An import holds the same value on the server. A tag's attributes and children can only hold data, so any import there is; elsewhere a bare import or a namespace member may be a function, and a read through a named import (a copy dictionary) is data only under `importMembersAreData`.
  const ofImport = (position: Position, isDictionaryRead: boolean) => ({
    data: position === 'text' || (isDictionaryRead && importMembersAreData),
    stable: true,
  })
  const importOf = (variable: Variable | null) =>
    !!variable &&
    variable.defs.length > 0 &&
    variable.defs.every((def) => def.type === DefinitionType.ImportBinding)
  const ofIdentifier = (node: TSESTree.Identifier, position: Position): Verdict => {
    if (node.name === 'undefined') return ALWAYS
    const variable = variableOf(node, node.name)
    if (!variable || variable.defs.length === 0) return NEVER
    if (importOf(variable)) return ofImport(position, false)
    return ofBinding(variable)
  }
  // The value a key of an object literal ends with: the last property of that name, joined with every spread or computed key after it, since either may replace it; an unknown key joins them all.
  const ofProperty = (
    object: TSESTree.ObjectExpression,
    name: string | undefined,
    position: Position,
  ) => {
    let verdict: Verdict | null = null
    for (const property of object.properties) {
      const isProperty = property.type === AST_NODE_TYPES.Property
      const propertyName = isProperty ? keyName(property.key, property.computed) : undefined
      const value = classify(isProperty ? property.value : property.argument, position)
      if (name !== undefined && propertyName === name) verdict = value
      else if (name === undefined || propertyName === undefined)
        verdict = verdict ? both(verdict, value) : value
    }
    return verdict ?? NEVER
  }
  const ofMember = (node: TSESTree.MemberExpression, position: Position): Verdict => {
    const name = keyName(node.property, node.computed)
    if (name !== undefined && METHOD_NAMES.has(name)) return NEVER
    const key = node.computed ? classify(node.property, position) : ALWAYS
    if (node.object.type !== AST_NODE_TYPES.Identifier)
      return both(classify(node.object, position), key)
    const variable = variableOf(node.object, node.object.name)
    if (importOf(variable)) return both(ofImport(position, !isNamespaceImport(variable)), key)
    const [def] = variable?.defs ?? []
    if (
      !variable ||
      def?.type !== DefinitionType.Variable ||
      !def.node.init ||
      def.node.id.type !== AST_NODE_TYPES.Identifier
    )
      return both(ofIdentifier(node.object, position), key)
    if ((def.parent.kind !== 'const' && isReassigned(variable)) || isMutated(variable)) return NEVER
    const binding = ofBinding(variable)
    const { init } = def.node
    if (init.type === AST_NODE_TYPES.ObjectExpression) {
      const value = ofProperty(init, name, position)
      return { data: value.data && key.data, stable: value.stable && binding.stable && key.stable }
    }
    if (init.type === AST_NODE_TYPES.ArrayExpression && node.computed) return both(binding, key)
    if (LITERAL_INITS.has(init.type))
      return name === 'length' ? { data: true, stable: binding.stable } : NEVER
    return both(binding, key)
  }
  const classify = (node: TSESTree.Node | null, position: Position): Verdict => {
    if (!node) return NEVER
    switch (node.type) {
      case AST_NODE_TYPES.Literal:
        // A RegExp is an instance, which React refuses to pass from a server component.
        return 'regex' in node ? NEVER : ALWAYS
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
      case AST_NODE_TYPES.MemberExpression:
        return ofMember(node, position)
      case AST_NODE_TYPES.ChainExpression:
      case AST_NODE_TYPES.TSAsExpression:
      case AST_NODE_TYPES.TSSatisfiesExpression:
      case AST_NODE_TYPES.TSNonNullExpression:
        return classify(node.expression, position)
      case AST_NODE_TYPES.JSXElement:
      case AST_NODE_TYPES.JSXFragment:
        return PER_RENDER
      case AST_NODE_TYPES.Identifier:
        return ofIdentifier(node, position)
      default:
        return NEVER
    }
  }
  // What a tag renders: `data` when a server component could render the same thing (a tag name, an import, a namespace export, a module-level component, or a tag the parent passed in with a renderable default), `stable` when it is the same on every render.
  const ofTagExpression = (node: TSESTree.Node): Verdict => {
    if (node.type === AST_NODE_TYPES.Literal) return typeof node.value === 'string' ? ALWAYS : NEVER
    if (node.type === AST_NODE_TYPES.Identifier) return ofTagBinding(variableOf(node, node.name))
    if (node.type !== AST_NODE_TYPES.MemberExpression || node.object.type !== AST_NODE_TYPES.Identifier)
      return NEVER
    return isNamespaceImport(variableOf(node.object, node.object.name)) ? ALWAYS : NEVER
  }
  const ofTagBinding = (variable: Variable | null): Verdict => {
    if (!variable || variable.defs.length === 0) return NEVER
    const isModuleLevel = MODULE_SCOPES.has(variable.scope.type)
    return all(
      variable.defs.map((def) => {
        if (def.type === DefinitionType.ImportBinding) return ALWAYS
        if (def.type === DefinitionType.FunctionName) return isModuleLevel ? ALWAYS : NEVER
        if (def.type === DefinitionType.Parameter) {
          if (!isComponentFunction(def.node)) return NEVER
          const fallback = patternDefault(def.name)
          return fallback ? both(PER_RENDER, ofTagExpression(fallback)) : PER_RENDER
        }
        if (def.type !== DefinitionType.Variable) return NEVER
        return isModuleLevel && def.parent.kind === 'const' && isComponentInit(def.node.init)
          ? ALWAYS
          : NEVER
      }),
    )
  }
  const importedName = (variable: Variable | null) => {
    const [def] = variable?.defs ?? []
    if (def?.type !== DefinitionType.ImportBinding || def.node.type !== AST_NODE_TYPES.ImportSpecifier)
      return ''
    const { imported } = def.node
    return imported.type === AST_NODE_TYPES.Identifier ? imported.name : imported.value
  }
  // The provider shape: a name that reads as a context under any alias, or one lone `value` attribute.
  const isProvider = (element: TSESTree.JSXOpeningElement, name: string, variable: Variable | null) => {
    const [only, ...rest] = element.attributes
    const isValueOnly =
      rest.length === 0 &&
      only?.type === AST_NODE_TYPES.JSXAttribute &&
      only.name.type === AST_NODE_TYPES.JSXIdentifier &&
      only.name.name === 'value'
    return PROVIDER.test(name) || PROVIDER.test(importedName(variable)) || isValueOnly
  }
  const classifyTag = (element: TSESTree.JSXOpeningElement): Verdict => {
    const { name } = element
    if (name.type === AST_NODE_TYPES.JSXNamespacedName) return ALWAYS
    if (name.type === AST_NODE_TYPES.JSXIdentifier) {
      if (INTRINSIC.test(name.name)) return ALWAYS
      const variable = variableOf(element, name.name)
      return isProvider(element, name.name, variable) ? NEVER : ofTagBinding(variable)
    }
    const tag = jsxTagRoot(name)
    // One level into a namespace is a module export; dotting into anything else (`Ctx.Provider`, `motion.div`) reads into what may be a client reference, which a server component cannot do.
    return tag?.depth === 1 && isNamespaceImport(variableOf(element, tag.root.name)) ? ALWAYS : NEVER
  }
  const positionOf = (element: TSESTree.JSXOpeningElement): Position =>
    element.name.type === AST_NODE_TYPES.JSXIdentifier && INTRINSIC.test(element.name.name)
      ? 'text'
      : 'prop'
  return { classify, classifyTag, positionOf, variableOf, importedName }
}
