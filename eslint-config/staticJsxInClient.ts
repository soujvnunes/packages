import {
  ASTUtils,
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils'
import { findUseClientDirective } from './findUseClientDirective'
type Variable = TSESLint.Scope.Variable
type Jsx = TSESTree.JSXElement | TSESTree.JSXFragment
type Verdict = { isStatic: boolean; count: number }
const { DefinitionType, ScopeType } = TSESLint.Scope
const INTRINSIC = /^[a-z]/u
const MODULE_SCOPES = new Set<string>([ScopeType.module, ScopeType.global])
const MODULE_DECLARATIONS = new Set<string>([DefinitionType.FunctionName, DefinitionType.ClassName])
const isJsx = (node: TSESTree.Node): node is Jsx =>
  node.type === AST_NODE_TYPES.JSXElement || node.type === AST_NODE_TYPES.JSXFragment
const isImport = (variable: Variable | null) =>
  !!variable?.defs.some((def) => def.type === DefinitionType.ImportBinding)
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
    const variableOf = (node: TSESTree.Node, name: string) =>
      ASTUtils.findVariable(sourceCode.getScope(node), name)
    const resolving = new Set<Variable>()
    // An import, or a module-level `const` whose initializer is itself static, holds the same value on the server, so reading one (a copy dictionary, a label map) is as static as a literal; a global, a function or a browser read is not.
    const isStaticVariable = (variable: Variable | null): boolean => {
      if (!variable || variable.defs.length === 0 || resolving.has(variable)) return false
      resolving.add(variable)
      const isStaticBinding = variable.defs.every(
        (def) =>
          def.type === DefinitionType.ImportBinding ||
          (def.type === DefinitionType.Variable &&
            MODULE_SCOPES.has(variable.scope.type) &&
            def.parent.kind === 'const' &&
            isStatic(def.node.init)),
      )
      resolving.delete(variable)
      return isStaticBinding
    }
    const isStatic = (node: TSESTree.Node | null): boolean => {
      if (!node) return false
      switch (node.type) {
        case AST_NODE_TYPES.Literal:
        case AST_NODE_TYPES.JSXEmptyExpression:
          return true
        case AST_NODE_TYPES.TemplateLiteral:
          return node.expressions.every(isStatic)
        case AST_NODE_TYPES.UnaryExpression:
          return isStatic(node.argument)
        case AST_NODE_TYPES.BinaryExpression:
        case AST_NODE_TYPES.LogicalExpression:
          return isStatic(node.left) && isStatic(node.right)
        case AST_NODE_TYPES.ConditionalExpression:
          return isStatic(node.test) && isStatic(node.consequent) && isStatic(node.alternate)
        case AST_NODE_TYPES.ArrayExpression:
          return node.elements.every(
            (element) =>
              !element ||
              isStatic(element.type === AST_NODE_TYPES.SpreadElement ? element.argument : element),
          )
        case AST_NODE_TYPES.ObjectExpression:
          return node.properties.every((property) =>
            property.type === AST_NODE_TYPES.SpreadElement
              ? isStatic(property.argument)
              : property.kind === 'init' && !property.method && isStatic(property.value),
          )
        case AST_NODE_TYPES.MemberExpression:
          return isStatic(node.object) && (!node.computed || isStatic(node.property))
        case AST_NODE_TYPES.ChainExpression:
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
        case AST_NODE_TYPES.TSNonNullExpression:
          return isStatic(node.expression)
        case AST_NODE_TYPES.Identifier:
          return isStaticVariable(variableOf(node, node.name))
        default:
          return false
      }
    }
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
      let root: TSESTree.JSXTagNameExpression = name.object
      let depth = 1
      while (root.type === AST_NODE_TYPES.JSXMemberExpression) {
        root = root.object
        depth += 1
      }
      if (root.type !== AST_NODE_TYPES.JSXIdentifier) return false
      const variable = variableOf(element, root.name)
      // One level into a namespace import is a module export; dotting into a named import (`Ctx.Provider`, `motion.div`) reads into what may be a client reference, which a server parent cannot do.
      if (isImport(variable))
        return (
          depth === 1 &&
          !!variable?.defs.every(
            (def) =>
              def.type === DefinitionType.ImportBinding &&
              def.node.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
          )
        )
      return isModuleBinding(variable)
    }
    const isStaticAttribute = (
      attribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute,
      onComponent: boolean,
    ) => {
      if (attribute.type !== AST_NODE_TYPES.JSXAttribute) return false
      const { value } = attribute
      if (!value || value.type === AST_NODE_TYPES.Literal) return true
      if (value.type !== AST_NODE_TYPES.JSXExpressionContainer) return false
      const { expression } = value
      // A bare import handed to a component is most likely a function or a component, which a server parent cannot pass to a client component.
      if (
        onComponent &&
        expression.type === AST_NODE_TYPES.Identifier &&
        isImport(variableOf(expression, expression.name))
      )
        return false
      return isStatic(expression)
    }
    const verdicts = new Map<Jsx, Verdict>()
    const judge = (node: Jsx): Verdict => {
      const cached = verdicts.get(node)
      if (cached) return cached
      let isStaticNode = true
      let count = 0
      if (node.type === AST_NODE_TYPES.JSXElement) {
        const { openingElement } = node
        const onComponent =
          openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier ||
          !INTRINSIC.test(openingElement.name.name)
        isStaticNode =
          isStaticName(openingElement) &&
          openingElement.attributes.every((attribute) => isStaticAttribute(attribute, onComponent))
        count = 1
      }
      for (const child of node.children) {
        if (isJsx(child)) {
          const verdict = judge(child)
          isStaticNode &&= verdict.isStatic
          count += verdict.count
        } else if (child.type === AST_NODE_TYPES.JSXExpressionContainer)
          isStaticNode &&= isStatic(child.expression)
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
        } else if (child.type === AST_NODE_TYPES.JSXText) continue
        else if (child.type !== AST_NODE_TYPES.JSXExpressionContainer || !isStatic(child.expression))
          flush()
      }
      flush()
    }
    const visitRoot = (node: Jsx) => {
      if (!isJsx(node.parent)) visit(node)
    }
    return { JSXElement: visitRoot, JSXFragment: visitRoot }
  },
})
