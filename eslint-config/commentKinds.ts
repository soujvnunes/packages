import type { SourceCode } from 'eslint'
export type Comment = ReturnType<SourceCode['getAllComments']>[number]
export type Neighbour = ReturnType<SourceCode['getTokenAfter']>
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|\/\s*<|prettier-ignore|biome-ignore|(?:istanbul|c8|v8)\s+ignore\b|webpack[A-Z]|gitleaks:allow\b|@vitest-environment\b)/u
const BLOCK_DIRECTIVE = /^\s*(?:eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
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
export const spansLines = (comment: Comment) =>
  (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
export const followedOnLine = (comment: Comment, after: Neighbour) =>
  !!after?.loc && !!comment.loc && after.loc.start.line === comment.loc.end.line
