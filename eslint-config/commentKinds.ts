import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import type { AST, SourceCode } from 'eslint'
export type Comment = ReturnType<SourceCode['getAllComments']>[number]
export type Neighbour = ReturnType<SourceCode['getTokenAfter']>
export type Enclosing = TSESTree.Node | null
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|\/\s*<|prettier-ignore|biome-ignore|(?:istanbul|c8|v8)\s+ignore\b|(?:webpack|turbopack)[A-Z]|@vitest-environment\b)/u
const ALLOW_MARKER = /\bgitleaks:allow\b/u
const BLOCK_DIRECTIVE = /^\s*(?:eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
const PRAGMA =
  /^\s*(?:@ts-(?:expect-error|ignore|nocheck|check)\b|@jsx(?:Frag|ImportSource|Runtime)?\b|[@#]__[A-Z_]+__|[@#]\s*source(?:Mapping)?URL=|@jest-environment\b|@vite-ignore\b|@refresh\s+reset\b|@license\b|@preserve\b|@format\b|@prettier\b|@internal\s*$|node:coverage\s)/u
const TYPED = /^\s*\{/u
const NAMED = /^\s*[{\w$]/u
const TYPE_TAGS = new Map<string, RegExp>([
  ['type', TYPED],
  ['param', TYPED],
  ['returns', TYPED],
  ['return', TYPED],
  ['satisfies', TYPED],
  ['enum', TYPED],
  ['this', TYPED],
  ['typedef', NAMED],
  ['callback', NAMED],
  ['template', NAMED],
  ['extends', NAMED],
  ['augments', NAMED],
  ['implements', NAMED],
  ['import', /^\s*[{*\w$]/u],
  ['overload', /^/u],
])
const ANNOTATION = /^\s*[@#]/u
const BLOCK_ANNOTATION = /^\s*[\w-]+:\S/u
export const isComment = (token: Neighbour) => token?.type === 'Line' || token?.type === 'Block'
export const isDocShaped = (comment: Comment) =>
  comment.type === 'Block' && comment.value.startsWith('*')
export const isBanner = (comment: Comment) => comment.type === 'Block' && comment.value.startsWith('!')
const pragmaText = (comment: Comment) => comment.value.replace(/^\*+/u, '')
export const isDirectiveText = (text: string) => DIRECTIVE.test(text) || ANNOTATION.test(text)
export const isDirective = (comment: Comment) =>
  isDirectiveText(pragmaText(comment)) ||
  (comment.type === 'Block' &&
    (BLOCK_DIRECTIVE.test(comment.value) ||
      (!isDocShaped(comment) && BLOCK_ANNOTATION.test(comment.value))))
export const isToolDirective = (comment: Comment) => {
  const text = pragmaText(comment)
  return (
    DIRECTIVE.test(text) ||
    PRAGMA.test(text) ||
    (comment.type === 'Block' && BLOCK_DIRECTIVE.test(comment.value))
  )
}
export const holdsTag = (comment: Comment) => /(?:^|\s)@\w/u.test(pragmaText(comment))
export const isTypeAnnotation = (comment: Comment) => {
  const text = pragmaText(comment)
  const tag = isDocShaped(comment) ? /(?:^|\s)@(\w+)/u.exec(text) : null
  const shape = TYPE_TAGS.get(tag?.[1] ?? '')
  return !!tag && !!shape && shape.test(text.slice(tag.index + tag[0].length))
}
export const spansLines = (comment: Comment) =>
  (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
export const followedOnLine = (comment: Comment, after: Neighbour) =>
  !!after?.loc && !!comment.loc && after.loc.start.line === comment.loc.end.line
export const createCommentLookup = (sourceCode: SourceCode) => {
  const nodes = new Map<number, Enclosing>()
  const nodeAt = (index: number): Enclosing => {
    const known = nodes.get(index)
    if (known !== undefined) return known
    const node = sourceCode.getNodeByRangeIndex(index) as unknown as Enclosing
    nodes.set(index, node)
    return node
  }
  const enclosingNode = (comment: Comment) => nodeAt(comment.range?.[0] ?? 0)
  const jsxContainer = (comment: Comment) => {
    const node = enclosingNode(comment)
    return node?.type === AST_NODE_TYPES.JSXEmptyExpression ? node.parent : null
  }
  const sidesOf = (span: AST.SourceLocation | null | undefined) => {
    if (!span) return null
    const { lines } = sourceCode
    return {
      before: (lines[span.start.line - 1] ?? '').slice(0, span.start.column).trim() !== '',
      after: (lines[span.end.line - 1] ?? '').slice(span.end.column).trim() !== '',
    }
  }
  const sides = (comment: Comment) => sidesOf(jsxContainer(comment)?.loc ?? comment.loc)
  const isOwnLine = (comment: Comment) => {
    const side = comment.type === 'Line' ? sidesOf(comment.loc) : sides(comment)
    return !!side && !side.before && !side.after
  }
  const isAllowMarker = (comment: Comment) => {
    if (spansLines(comment) || !ALLOW_MARKER.test(comment.value)) return false
    const before = sourceCode.getTokenBefore(comment)
    return !!before?.loc && before.loc.end.line === comment.loc?.start.line
  }
  return { nodeAt, enclosingNode, jsxContainer, sides, isOwnLine, isAllowMarker }
}
