import type { AST, Rule, SourceCode } from 'eslint'
// Taken from ESLint's own surface rather than importing `estree`, which is only a transitive type package here and does not resolve.
type Comment = ReturnType<SourceCode['getAllComments']>[number]
type Commented = Parameters<SourceCode['getText']>[0]
// A comment carrying machine semantics is exempt, run and all: joining puts prose in front of the keyword and the tool stops seeing the directive. There is no correct one-line form for a mixed run either, since TypeScript skips intervening comment lines when matching `@ts-expect-error` and ESLint does not, so both would have to be first.
const DIRECTIVE =
  /^\s*(?:eslint\b|eslint-disable\b|eslint-disable-line\b|eslint-disable-next-line\b|eslint-enable\b|eslint-env\b|global\b|globals\b|exported\b|@ts-expect-error|@ts-ignore|@ts-nocheck|\/\s*<reference|prettier-ignore|biome-ignore|(?:istanbul|c8|v8|node:coverage)\s+ignore|@jsx\b|@jsxImportSource\b|@vitest-environment\b|vitest-environment\b|@vite-ignore\b|webpack[A-Z]|@license\b|@preserve\b|#__PURE__|sourceMappingURL=|sourceURL=)/u
// Only what a person typed as a comment. The interpreter line is spelled `Shebang` from SourceCode and `Hashbang` from the tokenizer, so an allow-list catches both where a deny-list on one spelling rots.
const isComment = (comment: Comment) => comment.type === 'Line' || comment.type === 'Block'
const isDirective = (comment: Comment) => DIRECTIVE.test(comment.value)
const spansLines = (comment: Comment) => (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
// A line terminator reaching the output would leave the comment multi-line while the rule considered it fixed, so every fix asserts on its finished text rather than trusting how the pieces were split.
const isOneLine = (text: string) => !/[\r\n\u2028\u2029]/u.test(text)
const collapse = (text: string) => text.replace(/\s+/gu, ' ').trim()
const enclosingJsxComment = (sourceCode: SourceCode, comment: Comment) => {
  if (comment.type !== 'Block') return null
  const node = sourceCode.getNodeByRangeIndex(comment.range?.[0] ?? 0) as {
    type?: string
    parent?: Commented
  } | null
  return node?.type === 'JSXEmptyExpression' ? (node.parent ?? null) : null
}
// Own-line means nothing else shares the comment's lines, so a trailing `const x = 1 // note` is not one of the two touching lines. Measured on the line text around the comment's own span rather than on neighbouring tokens, because JSX whitespace is itself a JSXText token that starts on the line above and would make every `{/* … */}` look crowded. A JSX comment is measured from its `{ … }` container, since the braces always sit beside it.
const isOwnLine = (sourceCode: SourceCode, comment: Comment) => {
  const container = enclosingJsxComment(sourceCode, comment)
  const span = (container?.loc ?? comment.loc) as AST.SourceLocation | undefined
  if (!span) return false
  const lines = sourceCode.getLines()
  const before = (lines[span.start.line - 1] ?? '').slice(0, span.start.column)
  const after = (lines[span.end.line - 1] ?? '').slice(span.end.column)
  return before.trim() === '' && after.trim() === ''
}
// Collapsing a block that holds the only line break between two tokens removes a LineTerminator the grammar uses for semicolon insertion, which changes what the program returns. Comments count as tokens here, or two adjacent blocks each look safe alone and both fixes land in the same pass.
const breaksSemicolonInsertion = (sourceCode: SourceCode, comment: Comment) => {
  const before = sourceCode.getTokenBefore(comment, { includeComments: true })
  const after = sourceCode.getTokenAfter(comment, { includeComments: true })
  if (!before?.loc || !after?.loc) return false
  return (
    before.loc.end.line === (comment.loc?.start.line ?? 0) &&
    after.loc.start.line === (comment.loc?.end.line ?? 0)
  )
}
// The JSDoc star is CONTENT inside `comment.value`, so the interior is sliced off the raw text instead: rebuilding the delimiter turns `/**` into `/* *` and the symbol stops carrying documentation, which is what `no-deprecated` reads.
const collapsedBlock = (sourceCode: SourceCode, comment: Comment) => {
  const raw = sourceCode.getText(comment as unknown as Commented)
  const open = raw.startsWith('/**') || raw.startsWith('/*!') ? raw.slice(0, 3) : '/*'
  const body = collapse(
    raw
      .slice(open.length, -2)
      .split(/\r\n|[\r\n\u2028\u2029]/u)
      .map((line) => line.trim().replace(/^\*+ ?/u, ''))
      .filter(Boolean)
      .join(' '),
  )
  const text = body ? `${open} ${body} */` : `${open} */`
  // A space at every seam, then one terminator only: stripping ` * ` can butt a line ending in `*` against one starting with `/`, manufacturing an early `*/` that ends the comment and leaves the rest as code.
  return isOneLine(text) && text.indexOf('*/') === text.length - 2 ? text : null
}
export const oneLineComments: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: { description: 'Require a comment to occupy exactly one line, however long it runs.' },
    fixable: 'whitespace',
    schema: [],
    messages: {
      adjacent:
        'Two comment lines are touching, and a bare `//` between them does not make them two comments. A comment is one line, however long it runs: join them, or move the rationale to the README or the project MANIFEST.',
      block:
        'This block comment spans lines. A comment is one line, however long it runs: collapse it, or move the rationale to the README or the project MANIFEST.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const comments = sourceCode.getAllComments().filter(isComment)
    return {
      'Program:exit'() {
        for (const comment of comments) {
          if (!spansLines(comment) || isDirective(comment)) continue
          const text = collapsedBlock(sourceCode, comment)
          const risky = breaksSemicolonInsertion(sourceCode, comment)
          context.report({
            loc: comment.loc as AST.SourceLocation,
            messageId: 'block',
            fix: text && !risky ? (fixer) => fixer.replaceText(comment, text) : null,
          })
        }
        // Runs are built from single-line comments only. A multi-line block is the other failure and is collapsed first, so the two fixes never overlap in one pass.
        const joinable = comments.filter(
          (comment) => !spansLines(comment) && isOwnLine(sourceCode, comment),
        )
        let run: Comment[] = []
        const flush = () => {
          const current = run
          run = []
          if (current.length < 2) return
          // One directive anywhere exempts the whole run, since joining is a whole-run operation.
          if (current.some(isDirective)) return
          const jsx = current.some((comment) => enclosingJsxComment(sourceCode, comment))
          const body = collapse(current.map((comment) => comment.value.trim()).join(' '))
          const text = `// ${body}`
          const first = current[0]
          const last = current[current.length - 1]
          if (!first?.loc || !last?.loc) return
          context.report({
            loc: { start: first.loc.start, end: last.loc.end },
            messageId: 'adjacent',
            // A JSX run reports without a fix: merging `{/* a */}` with `{/* b */}` means editing sibling containers, and raw range surgery there can swallow a value-bearing expression.
            fix:
              jsx || !body || !isOneLine(text)
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
export const oneLineCommentsPlugin = {
  meta: { name: '@soujvnunes/eslint-config', version: '0.6.0' },
  rules: { 'one-line-comments': oneLineComments },
}
