import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
export type Comment = TSESTree.Comment
export type Neighbour = TSESTree.Token | null
export type Enclosing = TSESTree.Node | null
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|\/\s*<|prettier-ignore|biome-ignore|(?:istanbul|c8|v8)\s+ignore\b|(?:webpack|turbopack)[A-Z]|@vitest-environment\b)/u
const ALLOW_MARKER = /\bgitleaks:allow\b/u
const BLOCK_DIRECTIVE = /^\s*(?:eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
const PRAGMA =
  /^\s*(?:@ts-(?:expect-error|ignore|nocheck|check)\b|@jsx(?:Frag|ImportSource|Runtime)?\b|[@#]__[A-Z_]+__|[@#]\s*source(?:Mapping)?URL=|@jest-environment\b|@vite-ignore\b|@refresh\s+reset\b|@license\b|@preserve\b|@format\b|@prettier\b|@internal\s*$|node:coverage\s)/u
const TYPED = /^\s*\{/u
const NAME = /^[\w$]+$/u
const IMPORT_CLAUSE = /^\s*(?:\{[^}]*\}|\*\s*as\s+[\w$]+|[\w$]+)\s+from\s+['"]/u
const TYPED_TAG = /(?:^|\s)@(?:param|returns?)\s*\{/u
const firstLine = (rest: string) => (rest.split(/\r?\n/u)[0] ?? '').trim()
const typed = (rest: string) => TYPED.test(rest)
const named = (rest: string) => typed(rest) || NAME.test(firstLine(rest))
const nameList = (rest: string) =>
  typed(rest) ||
  firstLine(rest)
    .split(',')
    .every((part) => NAME.test(part.trim()))
const heritage = (rest: string) =>
  typed(rest) || /^[\w$.]+$/u.test(firstLine(rest).replace(/<.*>$/u, ''))
const TYPE_TAGS = new Map<string, (rest: string) => boolean>([
  ['type', typed],
  ['param', typed],
  ['returns', typed],
  ['return', typed],
  ['satisfies', typed],
  ['enum', typed],
  ['this', typed],
  ['typedef', named],
  ['callback', named],
  ['template', nameList],
  ['extends', heritage],
  ['augments', heritage],
  ['implements', heritage],
  ['import', (rest) => IMPORT_CLAUSE.test(rest)],
  ['overload', (rest) => TYPED_TAG.test(rest)],
])
const ANNOTATION = /^\s*[@#]/u
const BLOCK_ANNOTATION = /^\s*[\w-]+:\S/u
export const isComment = (token: Neighbour): token is Comment =>
  token?.type === AST_TOKEN_TYPES.Line || token?.type === AST_TOKEN_TYPES.Block
export const isDocShaped = (comment: Comment) =>
  comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith('*')
export const isBanner = (comment: Comment) =>
  comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith('!')
const pragmaText = (comment: Comment) => comment.value.replace(/^\*+/u, '')
export const isDirectiveText = (text: string) => DIRECTIVE.test(text) || ANNOTATION.test(text)
export const isDirective = (comment: Comment) =>
  isDirectiveText(pragmaText(comment)) ||
  (comment.type === AST_TOKEN_TYPES.Block &&
    (BLOCK_DIRECTIVE.test(comment.value) ||
      (!isDocShaped(comment) && BLOCK_ANNOTATION.test(comment.value))))
export const isToolDirective = (comment: Comment) => {
  const text = pragmaText(comment)
  return (
    DIRECTIVE.test(text) ||
    PRAGMA.test(text) ||
    (comment.type === AST_TOKEN_TYPES.Block && BLOCK_DIRECTIVE.test(comment.value))
  )
}
export const holdsTag = (comment: Comment) => /(?:^|\s)@\w/u.test(pragmaText(comment))
export const isTypeAnnotation = (comment: Comment) => {
  const text = pragmaText(comment)
  const tag = isDocShaped(comment) ? /(?:^|\s)@(\w+)/u.exec(text) : null
  const shape = TYPE_TAGS.get(tag?.[1] ?? '')
  return !!tag && !!shape && shape(text.slice(tag.index + tag[0].length))
}
export const spansLines = (comment: Comment) => comment.loc.start.line !== comment.loc.end.line
export const followedOnLine = (comment: Comment, after: Neighbour) =>
  !!after && after.loc.start.line === comment.loc.end.line
export const createCommentLookup = (sourceCode: Readonly<TSESLint.SourceCode>) => {
  const nodes = new Map<number, Enclosing>()
  const nodeAt = (index: number): Enclosing => {
    const known = nodes.get(index)
    if (known !== undefined) return known
    const node = sourceCode.getNodeByRangeIndex(index)
    nodes.set(index, node)
    return node
  }
  const enclosingNode = (comment: Comment) => nodeAt(comment.range[0])
  const jsxContainer = (comment: Comment) => {
    const node = enclosingNode(comment)
    return node?.type === AST_NODE_TYPES.JSXEmptyExpression ? node.parent : null
  }
  const sidesOf = (span: TSESTree.SourceLocation) => {
    const { lines } = sourceCode
    return {
      before: (lines[span.start.line - 1] ?? '').slice(0, span.start.column).trim() !== '',
      after: (lines[span.end.line - 1] ?? '').slice(span.end.column).trim() !== '',
    }
  }
  const sides = (comment: Comment) => sidesOf(jsxContainer(comment)?.loc ?? comment.loc)
  const isOwnLine = (comment: Comment) => {
    const side = comment.type === AST_TOKEN_TYPES.Line ? sidesOf(comment.loc) : sides(comment)
    return !side.before && !side.after
  }
  const isAllowMarker = (comment: Comment) => {
    if (spansLines(comment) || !ALLOW_MARKER.test(comment.value)) return false
    const before = sourceCode.getTokenBefore(comment)
    const after = sourceCode.getTokenAfter(comment)
    return (
      (!!before && before.loc.end.line === comment.loc.start.line) ||
      (!!after && after.loc.start.line === comment.loc.end.line)
    )
  }
  return { nodeAt, enclosingNode, jsxContainer, sides, isOwnLine, isAllowMarker }
}
