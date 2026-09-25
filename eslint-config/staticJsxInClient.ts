import type { Rule, Scope } from 'eslint'
import { useClientDirective } from './useClientDirective'
// ESLint types the estree core only, so the JSX shapes this rule reads are declared here, as narrow as the reads.
type Value = {
  type: string
  expressions?: Value[]
  object?: Value
  property?: Value
  computed?: boolean
}
type Attribute = { type: string; value: (Value & { expression?: Value }) | null }
type Jsx = {
  type: string
  children: Jsx[]
  openingElement?: { attributes: Attribute[] }
  expression?: Value
  parent: { type: string }
}
type Verdict = { isStatic: boolean; count: number }
const JSX_PARENTS = new Set(['JSXElement', 'JSXFragment'])
const MODULE_SCOPES = new Set(['module', 'global'])
const DEFAULT_MIN_ELEMENTS = 3
// An import or a module-level `const` holds the same value on the server, so a read of one (a copy dictionary, a label map) is as static as a literal.
const isModuleConstant = (variable: Scope.Variable | null | undefined) =>
  !!variable &&
  MODULE_SCOPES.has(variable.scope.type) &&
  variable.defs.every(
    (def) =>
      def.type === 'ImportBinding' ||
      (def.type === 'Variable' && (def.parent as { kind?: string } | null)?.kind === 'const'),
  )
export const staticJsxInClient: Rule.RuleModule = {
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
  create(context) {
    const sourceCode = context.sourceCode
    if (!useClientDirective(sourceCode)) return {}
    const options = (context.options[0] ?? {}) as { minElements?: number }
    const minElements = options.minElements ?? DEFAULT_MIN_ELEMENTS
    const resolve = (identifier: Value) =>
      sourceCode
        .getScope(identifier as unknown as Rule.Node)
        .references.find((reference) => (reference.identifier as unknown) === identifier)?.resolved
    const isStaticExpression = (value: Value | undefined): boolean => {
      if (!value) return false
      if (value.type === 'Literal' || value.type === 'JSXEmptyExpression') return true
      if (value.type === 'TemplateLiteral') return (value.expressions ?? []).every(isStaticExpression)
      if (value.type === 'Identifier') return isModuleConstant(resolve(value))
      if (value.type === 'MemberExpression')
        return (
          isStaticExpression(value.object) && (!value.computed || isStaticExpression(value.property))
        )
      return false
    }
    const isStaticAttribute = (attribute: Attribute) =>
      attribute.type === 'JSXAttribute' &&
      (attribute.value === null ||
        attribute.value.type === 'Literal' ||
        (attribute.value.type === 'JSXExpressionContainer' &&
          isStaticExpression(attribute.value.expression)))
    const verdicts = new Map<Jsx, Verdict>()
    const judge = (node: Jsx): Verdict => {
      const cached = verdicts.get(node)
      if (cached) return cached
      let isStatic = node.openingElement?.attributes.every(isStaticAttribute) ?? true
      let count = node.type === 'JSXElement' ? 1 : 0
      for (const child of node.children) {
        if (JSX_PARENTS.has(child.type)) {
          const verdict = judge(child)
          isStatic &&= verdict.isStatic
          count += verdict.count
        } else if (child.type === 'JSXExpressionContainer') {
          isStatic &&= isStaticExpression(child.expression)
        } else if (child.type !== 'JSXText') isStatic = false
      }
      const verdict = { isStatic, count }
      verdicts.set(node, verdict)
      return verdict
    }
    // Reports the outermost static subtree only, so a static card is one finding rather than one per nested element.
    const visit = (node: Jsx) => {
      const { isStatic, count } = judge(node)
      if (node.type === 'JSXElement' && isStatic && count >= minElements) {
        context.report({
          node: node as unknown as Rule.Node,
          messageId: 'static',
          data: { count: String(count) },
        })
        return
      }
      for (const child of node.children) if (JSX_PARENTS.has(child.type)) visit(child)
    }
    const visitRoot = (node: Rule.Node) => {
      const jsx = node as unknown as Jsx
      if (!JSX_PARENTS.has(jsx.parent.type)) visit(jsx)
    }
    return { JSXElement: visitRoot, JSXFragment: visitRoot }
  },
}
