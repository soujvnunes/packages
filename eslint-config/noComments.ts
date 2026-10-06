import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import {
  createCommentLookup,
  holdsTag,
  isBanner,
  isComment,
  isDocShaped,
  isToolDirective,
  isTypeAnnotation,
  spansLines,
} from './commentKinds'
import type { Comment, Enclosing } from './commentKinds'
type Lookup = ReturnType<typeof createCommentLookup>
type Kind = 'directive' | 'banner' | 'jsdoc' | 'jsx' | 'jsxDirective' | 'attribute' | 'line' | 'block'
type Removal = { range: [number, number]; text: string; lines: [number, number] | null }
const JS_FILE = /\.[cm]?jsx?$/u
const isJsxNode = (node: Enclosing) =>
  !!node && node.type.startsWith('JSX') && node.type !== AST_NODE_TYPES.JSXExpressionContainer
const FUNCTION_NODES = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
])
const isEmptyBlock = (node: Enclosing) => {
  if (node?.type === AST_NODE_TYPES.SwitchStatement) return node.cases.length === 0
  if (node?.type === AST_NODE_TYPES.StaticBlock) return node.body.length === 0
  return (
    node?.type === AST_NODE_TYPES.BlockStatement &&
    node.body.length === 0 &&
    !FUNCTION_NODES.has(node.parent.type)
  )
}
const classify = (comment: Comment, lookup: Lookup): Kind => {
  const node = lookup.enclosingNode(comment)
  const inJsx = isJsxNode(node)
  if (isToolDirective(comment) || lookup.isAllowMarker(comment)) {
    return inJsx ? 'jsxDirective' : 'directive'
  }
  if (isBanner(comment)) return 'banner'
  if (inJsx) return node?.type === AST_NODE_TYPES.JSXEmptyExpression ? 'jsx' : 'attribute'
  if (isDocShaped(comment)) return 'jsdoc'
  return comment.type === AST_TOKEN_TYPES.Line ? 'line' : 'block'
}
const KEPT =
  'Only a tool directive stays, such as `eslint-disable`, `@ts-expect-error`, a type annotation in a JS file, a lone `@internal` or a JSDoc holding only `@deprecated`.'
const MESSAGES = {
  line: `Comments are not allowed in code. Delete this \`//\` comment: a reason the code cannot carry belongs in the README. ${KEPT}`,
  block: `Comments are not allowed in code. Delete this block comment: a reason the code cannot carry belongs in the README. ${KEPT}`,
  jsdoc: `Comments are not allowed in code, JSDoc included. Delete this JSDoc: a reason the code cannot carry belongs in the README. ${KEPT}`,
  jsx: 'Comments are not allowed in JSX. Delete this `{/* */}` container; only a tool directive stays.',
  attribute: 'Comments are not allowed inside a JSX tag. Delete this one.',
}
type MessageId = keyof typeof MESSAGES
const MESSAGE_IDS: Record<Kind, MessageId | null> = {
  directive: null,
  banner: null,
  jsxDirective: null,
  jsdoc: 'jsdoc',
  jsx: 'jsx',
  attribute: 'attribute',
  line: 'line',
  block: 'block',
}
export const noComments = ESLintUtils.RuleCreator.withoutDocs<[], MessageId>({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow comments in code, JSDoc included, except tool directives, a type-annotation JSDoc in a JS file, a lone `@internal` and a JSDoc holding only `@deprecated`.',
    },
    fixable: 'code',
    schema: [],
    messages: MESSAGES,
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode
    const { lines, text } = sourceCode
    const lookup = createCommentLookup(sourceCode)
    const typedJs = JS_FILE.test(context.filename)
    const lineStart = (line: number) => sourceCode.getIndexFromLoc({ line, column: 0 })
    const lineEnd = (line: number) => lineStart(line) + (lines[line - 1]?.length ?? 0)
    const wholeLines = (first: number, last: number): [number, number] => {
      if (last < lines.length) return [lineStart(first), lineStart(last + 1)]
      if (first > 1) return [lineEnd(first - 1), text.length]
      return [0, text.length]
    }
    const removal = (comment: Comment, kind: Kind): Removal | null => {
      if (
        kind === 'attribute' ||
        (kind === 'jsdoc' && holdsTag(comment)) ||
        isEmptyBlock(lookup.enclosingNode(comment))
      ) {
        return null
      }
      const span = lookup.jsxContainer(comment) ?? comment
      const side = lookup.sides(comment)
      const { range, loc } = span
      const { before, after } = side
      if (!before && !after) {
        const bounds: [number, number] = [loc.start.line, loc.end.line]
        return { range: wholeLines(...bounds), text: '', lines: bounds }
      }
      if (kind === 'jsx') return null
      const previousEnd = sourceCode.getTokenBefore(comment, { includeComments: true })?.range[1]
      const nextStart = sourceCode.getTokenAfter(comment, { includeComments: true })?.range[0]
      if (before && after) {
        if (spansLines(comment) || previousEnd === undefined || nextStart === undefined) return null
        return { range: [previousEnd, nextStart], text: ' ', lines: null }
      }
      if (before) {
        return previousEnd === undefined
          ? null
          : { range: [previousEnd, range[1]], text: '', lines: null }
      }
      return nextStart === undefined ? null : { range: [range[0], nextStart], text: '', lines: null }
    }
    return {
      'Program:exit'() {
        const reports: { comment: Comment; messageId: MessageId; fix: Removal | null }[] = []
        for (const comment of sourceCode.getAllComments().filter(isComment)) {
          const kind: Kind =
            typedJs && isTypeAnnotation(comment) ? 'directive' : classify(comment, lookup)
          const messageId = MESSAGE_IDS[kind]
          if (messageId) reports.push({ comment, messageId, fix: removal(comment, kind) })
        }
        const ownLine = reports
          .map(({ fix }) => fix)
          .filter((fix): fix is Removal & { lines: [number, number] } => !!fix?.lines)
          .sort((a, b) => a.lines[0] - b.lines[0])
        let run: (Removal & { lines: [number, number] })[] = []
        const flush = () => {
          const first = run[0]
          const last = run[run.length - 1]
          if (first && last) {
            const range = wholeLines(first.lines[0], last.lines[1])
            for (const fix of run) fix.range = range
          }
          run = []
        }
        for (const fix of ownLine) {
          const previous = run[run.length - 1]
          if (previous && previous.lines[1] + 1 !== fix.lines[0]) flush()
          run.push(fix)
        }
        flush()
        for (const { comment, messageId, fix } of reports) {
          context.report({
            loc: comment.loc,
            messageId,
            fix: fix ? (fixer) => fixer.replaceTextRange(fix.range, fix.text) : null,
          })
        }
      },
    }
  },
})
