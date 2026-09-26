import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from '@typescript-eslint/utils'
import { createClassifier } from './createClassifier'
import { createClientNeedTracker } from './createClientNeedTracker'
import { findUseClientDirective } from './findUseClientDirective'
import { isComponentFunction } from './isComponentFunction'
import { isFunctionAttribute } from './isFunctionAttribute'
type Jsx = TSESTree.JSXElement | TSESTree.JSXFragment
type Verdict = { isStatic: boolean; count: number }
type Position = ReturnType<ReturnType<typeof createClassifier>['positionOf']>
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
])
const isJsx = (node: TSESTree.Node): node is Jsx =>
  node.type === AST_NODE_TYPES.JSXElement || node.type === AST_NODE_TYPES.JSXFragment
const isRenderedByComponent = (node: TSESTree.Node) => {
  let current: TSESTree.Node | undefined = node.parent
  while (current && !FUNCTIONS.has(current.type)) current = current.parent
  return !current || isComponentFunction(current)
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
    const { classify, classifyTag, positionOf } = createClassifier(sourceCode, true)
    // A file that needs nothing from the client belongs to no-needless-use-client, whose fix (delete the directive) makes this rule's moot.
    const tracker = createClientNeedTracker(sourceCode)
    const isStatic = (node: TSESTree.Node, position: Position) => {
      const verdict = classify(node, position)
      return verdict.data && verdict.stable
    }
    const isStaticAttribute = (
      attribute: TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute,
      position: Position,
    ) => {
      if (attribute.type !== AST_NODE_TYPES.JSXAttribute) return false
      const key = attribute.name.type === AST_NODE_TYPES.JSXIdentifier ? attribute.name.name : ''
      if (isFunctionAttribute(key)) return false
      const { value } = attribute
      if (!value || value.type === AST_NODE_TYPES.Literal) return true
      return (
        value.type === AST_NODE_TYPES.JSXExpressionContainer && isStatic(value.expression, position)
      )
    }
    // A tag's attributes and children can only hold data, while a component's can hold a function; a fragment's children are its parent's.
    const childPosition = (node: Jsx): Position =>
      node.type === AST_NODE_TYPES.JSXElement ? positionOf(node.openingElement) : 'prop'
    const verdicts = new Map<Jsx, Verdict>()
    const judge = (node: Jsx): Verdict => {
      const cached = verdicts.get(node)
      if (cached) return cached
      const position = childPosition(node)
      let isStaticNode = true
      let count = 0
      if (node.type === AST_NODE_TYPES.JSXElement) {
        const { openingElement } = node
        const tag = classifyTag(openingElement)
        isStaticNode =
          tag.data &&
          tag.stable &&
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
    const findings: { loc: TSESTree.SourceLocation; count: number }[] = []
    // Reports the outermost static subtree only, so a static card is one finding rather than one per nested element.
    const visit = (node: Jsx) => {
      const { isStatic: isStaticNode, count } = judge(node)
      if (isStaticNode) {
        if (count >= minElements) findings.push({ loc: node.loc, count })
        return
      }
      // A run of static siblings under a dynamic parent can be passed in as `children` just the same, so it is judged as one block.
      const position = childPosition(node)
      let run: Jsx[] = []
      const flush = () => {
        const [first] = run
        const last = run.at(-1)
        const total = run.reduce((sum, member) => sum + judge(member).count, 0)
        if (first && last && run.length > 1 && total >= minElements)
          findings.push({ loc: { start: first.loc.start, end: last.loc.end }, count: total })
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
          !isStatic(child.expression, position)
        )
          flush()
        else if (child.type === AST_NODE_TYPES.JSXSpreadChild) flush()
      }
      flush()
    }
    const visitRoot = (node: Jsx) => {
      if (!isJsx(node.parent) && isRenderedByComponent(node)) visit(node)
    }
    return {
      ...tracker.listeners,
      JSXElement: visitRoot,
      JSXFragment: visitRoot,
      'Program:exit'() {
        if (!tracker.needsClient()) return
        for (const { loc, count } of findings)
          context.report({ loc, messageId: 'static', data: { count: String(count) } })
      },
    }
  },
})
