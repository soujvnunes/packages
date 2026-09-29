import type { AST, Rule } from 'eslint'
import {
  followedOnLine,
  isBanner,
  isComment,
  isDirective,
  isDirectiveText,
  isDocShaped,
  spansLines,
} from './commentKinds'
import type { Comment, Neighbour } from './commentKinds'
type Enclosing = { type?: string; parent?: Enclosing; loc?: AST.SourceLocation } | null
const isBare = (comment: Comment) => comment.type === 'Line' && comment.value.trim() === ''
const collapse = (text: string) => text.replace(/\s+/gu, ' ').trim()
const asLine = (body: string) => (body ? `// ${body}` : null)
const blockLines = (comment: Comment) =>
  comment.value
    .replace(/^!/u, '')
    .split(/\r\n|[\r\n\u2028\u2029]/u)
    .map((line) =>
      line
        .trim()
        .replace(/^\*(?= |$)/u, '')
        .trim(),
    )
const blockBody = (lines: string[]) => collapse(lines.filter(Boolean).join(' '))
const proseParagraphs = (lines: string[], skipTags: boolean) => {
  let count = 0
  let inSegment = false
  for (const line of lines) {
    if (line === '') {
      inSegment = false
      continue
    }
    if (inSegment) continue
    inSegment = true
    if (!(skipTags && line.startsWith('@'))) count += 1
  }
  return count
}
const opener = (comment: Comment) => {
  if (isDocShaped(comment)) return '/**'
  return isBanner(comment) ? '/*!' : '/*'
}
const collapsedBlock = (comment: Comment, lines: string[]) => {
  const open = opener(comment)
  const body = blockBody(lines)
  const text = body ? `${open} ${body} */` : `${open} */`
  return text.indexOf('*/') === text.length - 2 ? text : null
}
const isJsDoc = (comment: Comment, after: Neighbour) => {
  if (!isComment(after)) return true
  const next = after as unknown as Comment
  return isDirective(next) || (isDocShaped(next) && /^\*+\s*@/u.test(comment.value))
}
export const oneLineComments: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description:
        'Require a comment to occupy exactly one line, however long it runs, and reserve block comments for JSDoc and JSX.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      adjacent:
        'Two comment lines are touching. A comment is one line, however long it runs: join them, or write one line per fact beside the code it describes.',
      paragraphs:
        'A paragraph break inside a comment, a bare `//` between comment lines or an empty line inside a block, makes it a set of comments rather than one wrapped line, and joining it would bury every fact but the first. Write one line per fact beside the code it describes, or move the rationale to the README or the project MANIFEST.',
      block:
        'This block comment spans lines. A comment is one line, however long it runs: collapse it to one `//` line, or to one `/** … */` line when it is JSDoc, or move the rationale to the README or the project MANIFEST.',
      notDoc:
        'A block comment is for JSDoc and JSX only. Write this one as `//`, on its own line or at the end of one, or delete it if it is empty.',
      orphanDoc:
        '`/**` is JSDoc, and JSDoc sits directly above the code it documents. Move it there, join it with the doc under it, or write it as `//`.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const comments = sourceCode.getAllComments().filter(isComment)
    const enclosing = new Map<Comment, Enclosing>()
    const enclosingNode = (comment: Comment): Enclosing => {
      const known = enclosing.get(comment)
      if (known !== undefined) return known
      const node = sourceCode.getNodeByRangeIndex(comment.range?.[0] ?? 0) as Enclosing
      enclosing.set(comment, node)
      return node
    }
    const insideJsx = (comment: Comment) => enclosingNode(comment)?.type?.startsWith('JSX') ?? false
    const jsxContainer = (comment: Comment) => {
      const node = comment.type === 'Block' ? enclosingNode(comment) : null
      return node?.type === 'JSXEmptyExpression' ? (node.parent ?? null) : null
    }
    const isOwnLine = (comment: Comment) => {
      const span = jsxContainer(comment)?.loc ?? comment.loc
      if (!span) return false
      const lines = sourceCode.getLines()
      const before = (lines[span.start.line - 1] ?? '').slice(0, span.start.column)
      const after = (lines[span.end.line - 1] ?? '').slice(span.end.column)
      return before.trim() === '' && after.trim() === ''
    }
    const breaksSemicolonInsertion = (comment: Comment, after: Neighbour) => {
      if (insideJsx(comment)) return false
      const before = sourceCode.getTokenBefore(comment, { includeComments: true })
      return (
        !!before?.loc &&
        before.loc.end.line === comment.loc?.start.line &&
        followedOnLine(comment, after)
      )
    }
    const blockVerdict = (comment: Comment, after: Neighbour) => {
      const lines = blockLines(comment)
      const keepBlock = insideJsx(comment) || isDocShaped(comment) || isBanner(comment)
      const messageId = spansLines(comment) ? 'block' : 'notDoc'
      if (
        !insideJsx(comment) &&
        !isBanner(comment) &&
        proseParagraphs(lines, isDocShaped(comment)) > 1
      ) {
        return { messageId: 'paragraphs' as const, text: null }
      }
      if (keepBlock) return { messageId, text: collapsedBlock(comment, lines) }
      const body = blockBody(lines)
      const text = followedOnLine(comment, after) || isDirectiveText(body) ? null : asLine(body)
      return { messageId, text }
    }
    return {
      'Program:exit'() {
        const docs = new Set<Comment>()
        for (const comment of comments) {
          if (comment.type !== 'Block' || isDirective(comment)) continue
          const after = sourceCode.getTokenAfter(comment, { includeComments: true })
          if (spansLines(comment)) {
            const { messageId, text } = blockVerdict(comment, after)
            context.report({
              loc: comment.loc as AST.SourceLocation,
              messageId,
              fix:
                text && !breaksSemicolonInsertion(comment, after)
                  ? (fixer) => fixer.replaceText(comment, text)
                  : null,
            })
            continue
          }
          if (insideJsx(comment) || isBanner(comment)) continue
          if (isDocShaped(comment)) {
            if (isJsDoc(comment, after)) docs.add(comment)
            else context.report({ loc: comment.loc as AST.SourceLocation, messageId: 'orphanDoc' })
            continue
          }
          const { messageId, text } = blockVerdict(comment, after)
          context.report({
            loc: comment.loc as AST.SourceLocation,
            messageId,
            fix: text ? (fixer) => fixer.replaceText(comment, text) : null,
          })
        }
        const joinable = comments.filter(
          (comment) => !spansLines(comment) && !docs.has(comment) && isOwnLine(comment),
        )
        let run: Comment[] = []
        const flush = () => {
          const current = run
          run = []
          if (current.length < 2 || current.some(isDirective)) return
          const first = current[0]
          const last = current[current.length - 1]
          if (!first?.loc || !last?.loc) return
          const block = current.some((comment) => comment.type === 'Block')
          const texts = current.map((comment) => (isBare(comment) ? '' : comment.value.trim() || ' '))
          const paragraphs = proseParagraphs(texts, false) > 1
          const text = asLine(collapse(texts.join(' ')))
          context.report({
            loc: { start: first.loc.start, end: last.loc.end },
            messageId: paragraphs ? 'paragraphs' : 'adjacent',
            fix:
              paragraphs || block || !text
                ? null
                : (fixer) =>
                    fixer.replaceTextRange([first.range?.[0] ?? 0, last.range?.[1] ?? 0], text),
          })
        }
        for (const comment of joinable) {
          const previous = run[run.length - 1]
          const touching =
            previous && (previous.loc?.end.line ?? 0) + 1 === (comment.loc?.start.line ?? 0)
          if (!touching) flush()
          run.push(comment)
        }
        flush()
      },
    }
  },
}
