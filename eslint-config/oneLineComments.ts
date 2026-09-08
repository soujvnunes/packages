import type { AST, Rule, SourceCode } from 'eslint'
// Taken from ESLint's own surface rather than importing `estree`, which is only a transitive type package here and does not resolve.
type Comment = ReturnType<SourceCode['getAllComments']>[number]
type Commented = Parameters<SourceCode['getText']>[0]
type Neighbour = ReturnType<SourceCode['getTokenAfter']>
// A comment carrying machine semantics is exempt, run and all: joining puts prose in front of the keyword and the tool stops seeing the directive. There is no correct one-line form for a mixed run either, since TypeScript skips intervening comment lines when matching `@ts-expect-error` and ESLint does not, so both would have to be first.
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|@ts-expect-error|@ts-ignore|@ts-nocheck|@ts-check\b|\/\s*<reference|prettier-ignore|biome-ignore|(?:istanbul|c8|v8|node:coverage)\s+ignore\b|@jsx\b|@jsxImportSource\b|@jsxRuntime\b|@vitest-environment\b|vitest-environment\b|@vite-ignore\b|webpack[A-Z]|@license\b|@preserve\b|@__PURE__|#__PURE__|#__NO_SIDE_EFFECTS__|sourceMappingURL=|sourceURL=)/u
// `global`, `globals`, `exported`, `eslint` and `eslint-env` are directives ONLY in a block comment, so matching them on a line comment would exempt ordinary prose: `// global state lives here` is not a directive. The `/*!` banner is the minifier's keep marker and has no line form.
const BLOCK_DIRECTIVE = /^\s*(?:!|eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
// Only what a person typed as a comment. The interpreter line is spelled `Shebang` from SourceCode and `Hashbang` from the tokenizer, so an allow-list catches both where a deny-list on one spelling rots.
const isComment = (comment: Comment) => comment.type === 'Line' || comment.type === 'Block'
const isCommentToken = (token: Neighbour) => token?.type === 'Line' || token?.type === 'Block'
const isDirective = (comment: Comment) =>
  DIRECTIVE.test(comment.value) || (comment.type === 'Block' && BLOCK_DIRECTIVE.test(comment.value))
const spansLines = (comment: Comment) => (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
// A `/**` opener is JSDoc-shaped whatever follows it. Whether it IS JSDoc depends on what it sits above, which isJsDoc decides.
const isDocShaped = (comment: Comment) => comment.type === 'Block' && comment.value.startsWith('*')
// A bare `//` is a paragraph break, and a paragraph break means the lines around it are different comments.
const isBare = (comment: Comment) => comment.type === 'Line' && comment.value.trim() === ''
// A line terminator reaching the output would leave the comment multi-line while the rule considered it fixed, so every fix asserts on its finished text rather than trusting how the pieces were split.
const isOneLine = (text: string) => !/[\r\n\u2028\u2029]/u.test(text)
const collapse = (text: string) => text.replace(/\s+/gu, ' ').trim()
const asLine = (body: string) => (body ? `// ${body}` : '//')
const enclosingNode = (sourceCode: SourceCode, comment: Comment) =>
  sourceCode.getNodeByRangeIndex(comment.range?.[0] ?? 0) as {
    type?: string
    parent?: Commented
  } | null
// Any comment inside JSX is a JSX comment. The `{/* … */}` child is the common one, but an attribute-position `/* … */` has no `//` form either, since a line comment would swallow the rest of the tag.
const insideJsx = (sourceCode: SourceCode, comment: Comment) =>
  enclosingNode(sourceCode, comment)?.type?.startsWith('JSX') ?? false
const enclosingJsxComment = (sourceCode: SourceCode, comment: Comment) => {
  if (comment.type !== 'Block') return null
  const node = enclosingNode(sourceCode, comment)
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
const nextToken = (sourceCode: SourceCode, comment: Comment) =>
  sourceCode.getTokenAfter(comment, { includeComments: true })
// A `//` runs to the end of its line, so a block comment with code after it on that line has no line form.
const codeFollowsOnLine = (comment: Comment, after: Neighbour) =>
  !!after?.loc && !!comment.loc && after.loc.start.line === comment.loc.end.line
// JSDoc binds to the code directly below it, or beside it for a `/** @type */` cast, so a `//` above a JSDoc is a different comment about a different thing and not a wrapped continuation. A `/**` followed by another comment or by nothing documents nothing and is reported as misplaced rather than rewritten: TypeScript reads its tags across an intervening `//`, so turning it into `//` would silently drop a `@deprecated`.
const isJsDoc = (sourceCode: SourceCode, comment: Comment) => {
  if (!isDocShaped(comment)) return false
  const after = nextToken(sourceCode, comment)
  if (!after || isCommentToken(after)) return false
  return isOwnLine(sourceCode, comment) || codeFollowsOnLine(comment, after)
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
// The JSDoc star is CONTENT inside `comment.value`, so the interior is sliced off the raw text instead: rebuilding the delimiter from the value turns `/**` into `/* *` and the symbol stops carrying documentation, which is what `no-deprecated` reads.
const blockBody = (sourceCode: SourceCode, comment: Comment) => {
  const raw = sourceCode.getText(comment as unknown as Commented)
  return collapse(
    raw
      .slice(raw.startsWith('/**') ? 3 : 2, -2)
      .split(/\r\n|[\r\n\u2028\u2029]/u)
      .map((line) => line.trim().replace(/^\*+ ?/u, ''))
      .filter(Boolean)
      .join(' '),
  )
}
const collapsedBlock = (sourceCode: SourceCode, comment: Comment) => {
  const open = isDocShaped(comment) ? '/**' : '/*'
  const body = blockBody(sourceCode, comment)
  const text = body ? `${open} ${body} */` : `${open} */`
  // A space at every seam, then one terminator only: stripping ` * ` can butt a line ending in `*` against one starting with `/`, manufacturing an early `*/` that ends the comment and leaves the rest as code.
  return text.indexOf('*/') === text.length - 2 ? text : null
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
        'A bare `//` between comment lines marks a paragraph break, so this is a set of comments rather than one wrapped line, and joining it would bury every fact but the first. Write one line per fact beside the code it describes, or move the rationale to the README or the project MANIFEST.',
      block:
        'This block comment spans lines. A comment is one line, however long it runs: collapse it, or move the rationale to the README or the project MANIFEST.',
      notDoc:
        'A block comment is for JSDoc and JSX only. Write this one as `//`, on its own line or at the end of one.',
      orphanDoc:
        '`/**` is JSDoc, and JSDoc sits directly above or beside the code it documents. Move it there, or write it as `//`.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const comments = sourceCode.getAllComments().filter(isComment)
    return {
      'Program:exit'() {
        for (const comment of comments) {
          if (isDirective(comment)) continue
          const jsx = insideJsx(sourceCode, comment)
          const after = nextToken(sourceCode, comment)
          if (spansLines(comment)) {
            // Collapsed into `//` unless the block has to stay a block: JSX has no line form, a JSDoc keeps its opener so its tags survive, and code after the closing `*/` on the same line would be swallowed by a `//`.
            const keepBlock = jsx || isDocShaped(comment) || codeFollowsOnLine(comment, after)
            const text = keepBlock
              ? collapsedBlock(sourceCode, comment)
              : asLine(blockBody(sourceCode, comment))
            const risky = breaksSemicolonInsertion(sourceCode, comment)
            context.report({
              loc: comment.loc as AST.SourceLocation,
              messageId: 'block',
              fix:
                text && !risky && isOneLine(text) ? (fixer) => fixer.replaceText(comment, text) : null,
            })
            continue
          }
          if (comment.type !== 'Block' || jsx) continue
          if (isDocShaped(comment)) {
            if (!isJsDoc(sourceCode, comment)) {
              context.report({ loc: comment.loc as AST.SourceLocation, messageId: 'orphanDoc' })
            }
            continue
          }
          const text = asLine(collapse(comment.value))
          context.report({
            loc: comment.loc as AST.SourceLocation,
            messageId: 'notDoc',
            fix:
              codeFollowsOnLine(comment, after) || !isOneLine(text)
                ? null
                : (fixer) => fixer.replaceText(comment, text),
          })
        }
        // Runs are built from single-line comments only. A multi-line block is the other failure and is collapsed first, so the two fixes never overlap in one pass. A JSDoc is left out and so ends the run above it: it belongs to the symbol below, not to the comment above.
        const joinable = comments.filter(
          (comment) =>
            !spansLines(comment) && isOwnLine(sourceCode, comment) && !isJsDoc(sourceCode, comment),
        )
        let run: Comment[] = []
        const flush = () => {
          const current = run
          run = []
          if (current.length < 2) return
          // One directive anywhere exempts the whole run, since joining is a whole-run operation.
          if (current.some(isDirective)) return
          const jsx = current.some((comment) => enclosingJsxComment(sourceCode, comment))
          // A block comment in the run reports without a fix. A plain `/* … */` is rewritten as `//` by its own report and joins on the next pass; a misplaced `/**` keeps its opener, since TypeScript reads its tags across an intervening `//` and a `//` rewrite would silently disable `no-deprecated`.
          const block = current.some((comment) => comment.type === 'Block')
          // A paragraph set is several comments, and welding them into one line satisfies the letter of the rule while burying every fact but the first, so it reports and names the two remedies instead.
          const paragraphs = current.some(isBare)
          const body = collapse(current.map((comment) => comment.value.trim()).join(' '))
          const text = asLine(body)
          const first = current[0]
          const last = current[current.length - 1]
          if (!first?.loc || !last?.loc) return
          context.report({
            loc: { start: first.loc.start, end: last.loc.end },
            messageId: paragraphs ? 'paragraphs' : 'adjacent',
            // A JSX run reports without a fix: merging `{/* a */}` with `{/* b */}` means editing sibling containers, and raw range surgery there can swallow a value-bearing expression.
            fix:
              paragraphs || jsx || block || !body || !isOneLine(text)
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
  // No `version`: it feeds ESLint's cache key, and a hardcoded one drifts from package.json and serves stale cached results after a behaviour change.
  meta: { name: '@soujvnunes/eslint-config' },
  rules: { 'one-line-comments': oneLineComments },
}
