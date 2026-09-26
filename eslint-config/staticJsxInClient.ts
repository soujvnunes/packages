import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils, type TSESTree } from '@typescript-eslint/utils'
import { createClassifier } from './createClassifier'
import { findUseClientDirective } from './findUseClientDirective'
import { isComponentFunction } from './isComponentFunction'
import { isFunctionAttribute } from './isFunctionAttribute'
import { isFunctionNode } from './isFunctionNode'
import { needsClient } from './needsClient'
type Jsx = TSESTree.JSXElement | TSESTree.JSXFragment
type Judgement = { isStatic: boolean; count: number }
type Position = ReturnType<ReturnType<typeof createClassifier>['positionOf']>
const DISABLE_KEYWORDS = ['eslint-disable-next-line', 'eslint-disable-line', 'eslint-disable']
const isJsx = (node: TSESTree.Node) =>
  node.type === AST_NODE_TYPES.JSXElement || node.type === AST_NODE_TYPES.JSXFragment
const isRenderedByComponent = (node: TSESTree.Node) => {
  let current: TSESTree.Node | undefined = node.parent
  while (current && !isFunctionNode(current)) current = current.parent
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
    const directive = findUseClientDirective(sourceCode.ast)
    if (!directive) return {}
    const isDirectiveKept = () =>
      sourceCode.getAllComments().some((comment) => {
        const text = comment.value.trim()
        const keyword = DISABLE_KEYWORDS.find(
          (candidate) => text === candidate || text.startsWith(`${candidate} `),
        )
        if (!keyword) return false
        const list = text.slice(keyword.length)
        const rules =
          list
            .split('--')[0]
            ?.split(/[\s,]+/u)
            .filter(Boolean) ?? []
        const covers =
          rules.length === 0 || rules.some((rule) => rule.endsWith('no-needless-use-client'))
        const line = directive.loc.start.line
        if (keyword === 'eslint-disable-line') return covers && comment.loc.start.line === line
        if (keyword === 'eslint-disable-next-line') return covers && comment.loc.end.line === line - 1
        // ESLint honours a file-wide disable only in a block comment.
        return (
          covers && comment.type === AST_TOKEN_TYPES.Block && comment.range[1] <= directive.range[0]
        )
      })
    if (!needsClient(sourceCode) && !isDirectiveKept()) return {}
    const { classify, classifyTag, positionOf } = createClassifier(sourceCode, true)
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
    const childPosition = (node: Jsx) =>
      node.type === AST_NODE_TYPES.JSXElement ? positionOf(node.openingElement) : 'text'
    const verdicts = new Map<Jsx, Judgement>()
    const judge = (node: Jsx): Judgement => {
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
      const position = childPosition(node)
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
    return { JSXElement: visitRoot, JSXFragment: visitRoot }
  },
})
