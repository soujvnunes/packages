import type { AST, SourceCode } from 'eslint'
export type Comment = ReturnType<SourceCode['getAllComments']>[number]
export type Neighbour = ReturnType<SourceCode['getTokenAfter']>
export type Enclosing = {
  type: string
  range?: [number, number]
  loc?: AST.SourceLocation
  parent?: Enclosing
} | null
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|\/\s*<|prettier-ignore|biome-ignore|(?:istanbul|c8|v8)\s+ignore\b|(?:webpack|turbopack)[A-Z]|@vitest-environment\b)/u
const ANYWHERE = /\bgitleaks:allow\b/u
const BLOCK_DIRECTIVE = /^\s*(?:eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
const PRAGMA =
  /^\s*(?:@ts-(?:expect-error|ignore|nocheck|check)\b|@jsx(?:Frag|ImportSource|Runtime)?\b|[@#]__[A-Z_]+__|[@#]\s*source(?:Mapping)?URL=|@jest-environment\b|@vite-ignore\b|@refresh\s+reset\b|@license\b|@preserve\b|@format\b|@prettier\b|@internal\b|node:coverage\s)/u
const TYPE_TAGS = new Set([
  'type',
  'typedef',
  'callback',
  'satisfies',
  'template',
  'param',
  'returns',
  'return',
  'import',
])
const ANNOTATION = /^\s*[@#]/u
const BLOCK_ANNOTATION = /^\s*[\w-]+:\S/u
export const isComment = (token: Neighbour) => token?.type === 'Line' || token?.type === 'Block'
export const isDocShaped = (comment: Comment) =>
  comment.type === 'Block' && comment.value.startsWith('*')
export const isBanner = (comment: Comment) => comment.type === 'Block' && comment.value.startsWith('!')
const pragmaText = (comment: Comment) => comment.value.replace(/^\*+/u, '')
export const isDirectiveText = (text: string) =>
  DIRECTIVE.test(text) || ANYWHERE.test(text) || ANNOTATION.test(text)
export const isDirective = (comment: Comment) =>
  isDirectiveText(pragmaText(comment)) ||
  (comment.type === 'Block' &&
    (BLOCK_DIRECTIVE.test(comment.value) ||
      (!isDocShaped(comment) && BLOCK_ANNOTATION.test(comment.value))))
export const isToolDirective = (comment: Comment) => {
  const text = pragmaText(comment)
  return (
    DIRECTIVE.test(text) ||
    ANYWHERE.test(text) ||
    PRAGMA.test(text) ||
    (comment.type === 'Block' && BLOCK_DIRECTIVE.test(comment.value))
  )
}
export const isTypeAnnotation = (comment: Comment) =>
  isDocShaped(comment) && TYPE_TAGS.has(/(?:^|\s)@(\w+)/u.exec(comment.value)?.[1] ?? '')
export const spansLines = (comment: Comment) =>
  (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
export const followedOnLine = (comment: Comment, after: Neighbour) =>
  !!after?.loc && !!comment.loc && after.loc.start.line === comment.loc.end.line
export const createCommentLookup = (sourceCode: SourceCode) => {
  const nodes = new Map<number, Enclosing>()
  const nodeAt = (index: number): Enclosing => {
    const known = nodes.get(index)
    if (known !== undefined) return known
    const node = sourceCode.getNodeByRangeIndex(index) as Enclosing
    nodes.set(index, node)
    return node
  }
  const enclosingNode = (comment: Comment) => nodeAt(comment.range?.[0] ?? 0)
  const jsxContainer = (comment: Comment) => {
    const node = enclosingNode(comment)
    return node?.type === 'JSXEmptyExpression' ? (node.parent ?? null) : null
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
  return { nodeAt, enclosingNode, jsxContainer, sides, isOwnLine }
}
