import {
  ASTUtils,
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils'
import { createClassifier } from './createClassifier'
import { findUseClientDirective } from './findUseClientDirective'
import { isComponentFunction } from './isComponentFunction'
import { isNamespaceImport } from './isNamespaceImport'
import { jsxTagRoot } from './jsxTagRoot'
type Variable = TSESLint.Scope.Variable
type Jsx = TSESTree.JSXElement | TSESTree.JSXFragment
type Verdict = { isStatic: boolean; count: number }
const { DefinitionType, ScopeType } = TSESLint.Scope
const INTRINSIC = /^[a-z]/u
const HANDLER = /^on[A-Z]/u
// Intrinsic attributes that take a function, which a server parent cannot put on a tag.
const FUNCTION_ATTRIBUTES = new Set(['ref', 'action', 'formAction'])
const MODULE_SCOPES = new Set<string>([ScopeType.module, ScopeType.global])
const MODULE_DECLARATIONS = new Set<string>([DefinitionType.FunctionName, DefinitionType.ClassName])
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
])
const isJsx = (node: TSESTree.Node): node is Jsx =>
  node.type === AST_NODE_TYPES.JSXElement || node.type === AST_NODE_TYPES.JSXFragment
const isIntrinsic = (element: TSESTree.JSXOpeningElement) =>
  element.name.type === AST_NODE_TYPES.JSXIdentifier && INTRINSIC.test(element.name.name)
// Markup is movable only from a component body: in a callback a library or an event calls, no server parent exists to take it.
const isInComponentBody = (node: TSESTree.Node) => {
  let current: TSESTree.Node | undefined = node.parent
  while (current && !FUNCTIONS.has(current.type)) current = current.parent
  return !!current && isComponentFunction(current)
}
export const staticJsxInClient = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a subtree of static JSX inside a client module, where it ships to the browser and hydrates for nothing.',
    },
    schema: [
      {
        type: 'object',
        properties: { minElements: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: {
      static:
        'Static markup in a client file: {{count}} elements that read only literals, imports and module constants still ship to the browser and hydrate. Render them in the server parent and pass them in as `children` or a named ReactNode prop. Moving them to a file without the directive does not help while this file imports it.',
    },
  },
  defaultOptions: [{ minElements: 3 }],
  create(context, [{ minElements }]) {
    const { sourceCode } = context
    if (!findUseClientDirective(sourceCode.ast)) return {}
    const classify = createClassifier(sourceCode, true)
    const isStatic = (node: TSESTree.Node, position: 'text' | 'prop') => {
      const verdict = classify(node, position)
      return verdict.data && verdict.stable
    }
    const variableOf = (node: TSESTree.Node, name: string) =>
      ASTUtils.findVariable(sourceCode.getScope(node), name)
    // The component an element renders has to be the same one on the server: an import, or a function, class or `const` declared at module level.
    const isModuleBinding = (variable: Variable | null) =>
      !!variable &&
      variable.defs.length > 0 &&
      variable.defs.every(
        (def) =>
          def.type === DefinitionType.ImportBinding ||
          (MODULE_SCOPES.has(variable.scope.type) &&
            (MODULE_DECLARATIONS.has(def.type) ||
              (def.type === DefinitionType.Variable && def.parent.kind === 'const'))),
      )
    const isStaticName = (element: TSESTree.JSXOpeningElement) => {
      const { name } = element
      if (name.type === AST_NODE_TYPES.JSXNamespacedName) return true
      if (name.type === AST_NODE_TYPES.JSXIdentifier)
        return INTRINSIC.test(name.name) || isModuleBinding(variableOf(element, name.name))
      const tag = jsxTagRoot(name)
      if (!tag) return false
      const variable = variableOf(element, tag.root.name)
      // One level into a namespace is a module export; dotting into a named import (`Ctx.Provider`, `motion.div`) reads into what may be a client reference, which a server parent cannot do.
      if (variable?.defs.some((def) => def.type === DefinitionType.ImportBinding))
        return tag.depth === 1 && isNamespaceImport(variable)
      return isModuleBinding(variable)
    }
    const isStaticAttribute = (
      attribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute,
      position: 'text' | 'prop',
    ) => {
      if (attribute.type !== AST_NODE_TYPES.JSXAttribute) return false
      const key = attribute.name.type === AST_NODE_TYPES.JSXIdentifier ? attribute.name.name : ''
      if (HANDLER.test(key) || FUNCTION_ATTRIBUTES.has(key)) return false
      const { value } = attribute
      if (!value || value.type === AST_NODE_TYPES.Literal) return true
      return (
        value.type === AST_NODE_TYPES.JSXExpressionContainer && isStatic(value.expression, position)
      )
    }
    const verdicts = new Map<Jsx, Verdict>()
    const judge = (node: Jsx): Verdict => {
      const cached = verdicts.get(node)
      if (cached) return cached
      let isStaticNode = true
      let count = 0
      // A tag's attributes and children can only hold data, while a component's can hold a function.
      let position: 'text' | 'prop' = 'prop'
      if (node.type === AST_NODE_TYPES.JSXElement) {
        const { openingElement } = node
        position = isIntrinsic(openingElement) ? 'text' : 'prop'
        isStaticNode =
          isStaticName(openingElement) &&
          openingElement.attributes.every((attribute) => isStaticAttribute(attribute, position))
        count = 1
      }
      for (const child of node.children) {
        if (isJsx(child)) {
          const verdict = judge(child)
          isStaticNode &&= verdict.isStatic
          count += verdict.count
        } else if (child.type === AST_NODE_TYPES.JSXExpressionContainer)
          isStaticNode &&= isStatic(child.expression, position)
        else if (child.type !== AST_NODE_TYPES.JSXText) isStaticNode = false
      }
      const verdict = { isStatic: isStaticNode, count }
      verdicts.set(node, verdict)
      return verdict
    }
    const report = (loc: TSESTree.SourceLocation, count: number) =>
      context.report({ loc, messageId: 'static', data: { count: String(count) } })
    // Reports the outermost static subtree only, so a static card is one finding rather than one per nested element.
    const visit = (node: Jsx) => {
      const { isStatic: isStaticNode, count } = judge(node)
      if (isStaticNode) {
        if (count >= minElements) report(node.loc, count)
        return
      }
      // A run of static siblings under a dynamic parent can be passed in as `children` just the same, so it is judged as one block.
      let run: Jsx[] = []
      const flush = () => {
        const [first] = run
        const last = run.at(-1)
        const total = run.reduce((sum, member) => sum + judge(member).count, 0)
        if (first && last && run.length > 1 && total >= minElements)
          report({ start: first.loc.start, end: last.loc.end }, total)
        else for (const member of run) visit(member)
        run = []
      }
      for (const child of node.children) {
        if (isJsx(child) && judge(child).isStatic) run.push(child)
        else if (isJsx(child)) {
          flush()
          visit(child)
        } else if (
          child.type === AST_NODE_TYPES.JSXExpressionContainer &&
          !isStatic(child.expression, 'prop')
        )
          flush()
        else if (child.type === AST_NODE_TYPES.JSXSpreadChild) flush()
      }
      flush()
    }
    const visitRoot = (node: Jsx) => {
      if (!isJsx(node.parent) && isInComponentBody(node)) visit(node)
    }
    return { JSXElement: visitRoot, JSXFragment: visitRoot }
  },
})
