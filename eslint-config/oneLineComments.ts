import type { AST, Rule, SourceCode } from 'eslint'
// Taken from ESLint's own surface rather than importing `estree`, which is only a transitive type package here and does not resolve.
type Comment = ReturnType<SourceCode['getAllComments']>[number]
type Neighbour = ReturnType<SourceCode['getTokenAfter']>
type Enclosing = { type?: string; parent?: Enclosing; loc?: AST.SourceLocation } | null
// A comment carrying machine semantics is exempt, run and all: joining puts prose in front of the keyword and the tool stops seeing the directive, and rewriting its delimiters hides it from a tool that reads one form only. There is no correct one-line form for a mixed run either, since TypeScript skips intervening comment lines when matching `@ts-expect-error` and ESLint does not, so both would have to be first.
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|\/\s*<|prettier-ignore|biome-ignore|(?:istanbul|c8|v8)\s+ignore\b|webpack[A-Z])/u
// `global`, `globals`, `exported`, `eslint` and `eslint-env` are directives ONLY in a block comment, so matching them on a line comment would exempt ordinary prose: `// global state lives here` is not a directive.
const BLOCK_DIRECTIVE = /^\s*(?:eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
// Machine-read annotations open with a sigil (`@ts-expect-error`, `@jsxFrag`, `@__PURE__`, `#__NO_SIDE_EFFECTS__`, `# sourceMappingURL=`) or a `tool:` prefix (`node:coverage`), where prose opens with a word. Gating on the shape rather than on a list is what keeps a pragma the list never heard of from being welded into prose or rewritten into a form its tool cannot read. The list above keeps the word-shaped ones, and `\/\s*<` is every triple-slash directive (`reference`, `amd-module`, `amd-dependency`), whose value starts with the third slash.
const ANNOTATION = /^\s*[@#]/u
const BLOCK_ANNOTATION = /^\s*[\w-]+:\S/u
// Only what a person typed as a comment. The interpreter line is spelled `Shebang` from SourceCode and `Hashbang` from the tokenizer, so an allow-list catches both where a deny-list on one spelling rots. Takes any token, so the same predicate reads what follows a JSDoc.
const isComment = (token: Neighbour) => token?.type === 'Line' || token?.type === 'Block'
// A `/**` opener is JSDoc-shaped whatever follows it. Whether it IS in place depends on what sits under it, which isJsDoc decides.
const isDocShaped = (comment: Comment) => comment.type === 'Block' && comment.value.startsWith('*')
// The `/*!` banner is the minifier's keep marker, so it is the third block form with no `//` equivalent, after JSDoc and JSX.
const isBanner = (comment: Comment) => comment.type === 'Block' && comment.value.startsWith('!')
// The stars are content in a JSDoc's value, so a pragma written as `/** @jsx h */` is read past them.
const pragmaText = (comment: Comment) => comment.value.replace(/^\*+/u, '')
const isDirectiveText = (text: string) => DIRECTIVE.test(text) || ANNOTATION.test(text)
const isDirective = (comment: Comment) =>
  isDirectiveText(pragmaText(comment)) ||
  (comment.type === 'Block' &&
    (BLOCK_DIRECTIVE.test(comment.value) ||
      (!isDocShaped(comment) && BLOCK_ANNOTATION.test(comment.value))))
const spansLines = (comment: Comment) => (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
// A bare `//` is a paragraph break, and a paragraph break means the lines around it are different comments.
const isBare = (comment: Comment) => comment.type === 'Line' && comment.value.trim() === ''
// `\s` covers every LineTerminator, U+2028 and U+2029 included, so a collapsed body is one line by construction and no fix needs a second check.
const collapse = (text: string) => text.replace(/\s+/gu, ' ').trim()
// An empty body has no `//` form either: a bare `//` is the paragraph break this rule refuses to fix, so an empty block is reported for the author to delete.
const asLine = (body: string) => (body ? `// ${body}` : null)
// A `//` runs to the end of its line, so a block comment followed by anything on that line, code or another comment, has no line form.
const followedOnLine = (comment: Comment, after: Neighbour) =>
  !!after?.loc && !!comment.loc && after.loc.start.line === comment.loc.end.line
// The interior of a block on one line. The JSDoc star is CONTENT inside `comment.value`, so the gutter star is stripped per line and the opener is restored from the comment's shape, never rebuilt from the value: `/* *` in place of `/**` would stop the symbol carrying documentation, which is what `no-deprecated` reads. Only a lone star followed by a space or the line end is a gutter, so `**bold**` and `*.test.ts` keep their characters.
const blockBody = (comment: Comment) =>
  collapse(
    comment.value
      .replace(/^!/u, '')
      .split(/\r\n|[\r\n\u2028\u2029]/u)
      .map((line) => line.trim().replace(/^\*(?= |$)/u, ''))
      .filter(Boolean)
      .join(' '),
  )
const opener = (comment: Comment) => {
  if (isDocShaped(comment)) return '/**'
  return isBanner(comment) ? '/*!' : '/*'
}
const collapsedBlock = (comment: Comment) => {
  const open = opener(comment)
  const body = blockBody(comment)
  const text = body ? `${open} ${body} */` : `${open} */`
  // A space at every seam, then one terminator only: stripping ` * ` can butt a line ending in `*` against one starting with `/`, manufacturing an early `*/` that ends the comment and leaves the rest as code.
  return text.indexOf('*/') === text.length - 2 ? text : null
}
// JSDoc binds to the code under it, so a `//` above a JSDoc is a different comment about a different thing and not a wrapped continuation. A JSDoc is out of place only when prose sits between it and that code: TypeScript reads its tags across a directive line, so `/** Doc. */` above `// eslint-disable-next-line` is in place, and a tag-only doc such as `/** @typedef */` or `/** @jsx h */` stacks on the doc under it. It is reported rather than rewritten, since TypeScript reads the tags across an intervening `//` too and turning the doc into `//` would silently drop a `@deprecated`.
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
        'A bare `//` between comment lines marks a paragraph break, so this is a set of comments rather than one wrapped line, and joining it would bury every fact but the first. Write one line per fact beside the code it describes, or move the rationale to the README or the project MANIFEST.',
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
    // The deepest node around a comment, looked up once: ESLint walks the tree from the root on every call and does not cache it, and three predicates below want the same node.
    const enclosing = new Map<Comment, Enclosing>()
    const enclosingNode = (comment: Comment): Enclosing => {
      const known = enclosing.get(comment)
      if (known !== undefined) return known
      const node = sourceCode.getNodeByRangeIndex(comment.range?.[0] ?? 0) as Enclosing
      enclosing.set(comment, node)
      return node
    }
    // Any comment inside JSX is a JSX comment. The `{/* … */}` child is the common one, but an attribute-position `/* … */` has no `//` form either, since a line comment would swallow the rest of the tag.
    const insideJsx = (comment: Comment) => enclosingNode(comment)?.type?.startsWith('JSX') ?? false
    const jsxContainer = (comment: Comment) => {
      const node = comment.type === 'Block' ? enclosingNode(comment) : null
      return node?.type === 'JSXEmptyExpression' ? (node.parent ?? null) : null
    }
    // Own-line means nothing else shares the comment's lines, so a trailing `const x = 1 // note` is not one of the two touching lines. Measured on the line text around the comment's own span rather than on neighbouring tokens, because JSX whitespace is itself a JSXText token that starts on the line above and would make every `{/* … */}` look crowded. A JSX comment is measured from its `{ … }` container, since the braces always sit beside it.
    const isOwnLine = (comment: Comment) => {
      const span = jsxContainer(comment)?.loc ?? comment.loc
      if (!span) return false
      const lines = sourceCode.getLines()
      const before = (lines[span.start.line - 1] ?? '').slice(0, span.start.column)
      const after = (lines[span.end.line - 1] ?? '').slice(span.end.column)
      return before.trim() === '' && after.trim() === ''
    }
    // Collapsing a block that holds the only line break between two tokens removes a LineTerminator the grammar uses for semicolon insertion, which changes what the program returns. Comments count as tokens here, or two adjacent blocks each look safe alone and both fixes land in the same pass. JSX has no semicolon insertion, so a `{/* … */}` container's braces are not neighbours that matter.
    const breaksSemicolonInsertion = (comment: Comment, after: Neighbour) => {
      if (insideJsx(comment)) return false
      const before = sourceCode.getTokenBefore(comment, { includeComments: true })
      return (
        !!before?.loc &&
        before.loc.end.line === comment.loc?.start.line &&
        followedOnLine(comment, after)
      )
    }
    // The one legal one-line spelling of a block comment, or null when there is none. Decided in one place so the multi-line fix can never produce a shape the single-line check then forbids: a block stays a block for JSX, JSDoc and a banner; anything else becomes `//`, which needs the rest of its line to itself.
    const oneLineForm = (comment: Comment, after: Neighbour) => {
      if (insideJsx(comment) || isDocShaped(comment) || isBanner(comment)) {
        return collapsedBlock(comment)
      }
      const body = blockBody(comment)
      // A gutter star hid the sigil from isDirective, so `/*\n * @ts-ignore is what we avoid\n */` would come out as a live `// @ts-ignore`. A body that reads as a directive once flattened is left for the author.
      if (followedOnLine(comment, after) || isDirectiveText(body)) return null
      return asLine(body)
    }
    return {
      'Program:exit'() {
        // A JSDoc is left out of the runs below and so ends the run above it: it belongs to the symbol below, not to the comment above. Decided here, where the neighbour is already in hand.
        const docs = new Set<Comment>()
        for (const comment of comments) {
          if (comment.type !== 'Block' || isDirective(comment)) continue
          const after = sourceCode.getTokenAfter(comment, { includeComments: true })
          if (spansLines(comment)) {
            const text = oneLineForm(comment, after)
            context.report({
              loc: comment.loc as AST.SourceLocation,
              messageId: 'block',
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
          const text = oneLineForm(comment, after)
          context.report({
            loc: comment.loc as AST.SourceLocation,
            messageId: 'notDoc',
            fix: text ? (fixer) => fixer.replaceText(comment, text) : null,
          })
        }
        // Runs are built from single-line comments only. A multi-line block is the other failure and is collapsed first, so the two fixes never overlap in one pass.
        const joinable = comments.filter(
          (comment) => !spansLines(comment) && !docs.has(comment) && isOwnLine(comment),
        )
        let run: Comment[] = []
        const flush = () => {
          const current = run
          run = []
          // One directive anywhere exempts the whole run, since joining is a whole-run operation.
          if (current.length < 2 || current.some(isDirective)) return
          const first = current[0]
          const last = current[current.length - 1]
          if (!first?.loc || !last?.loc) return
          // A block comment in the run reports without a fix. Merging `{/* a */}` with `{/* b */}` means editing sibling JSX containers, where raw range surgery can swallow a value-bearing expression; a plain `/* … */` is rewritten as `//` by its own report and joins on the next pass; a misplaced `/**` keeps its opener, since TypeScript reads its tags across an intervening `//` and a `//` rewrite would silently disable `no-deprecated`.
          const block = current.some((comment) => comment.type === 'Block')
          // A paragraph set is several comments, and welding them into one line satisfies the letter of the rule while burying every fact but the first, so it reports and names the two remedies instead. Only a bare `//` BETWEEN two texts separates anything; one at either edge of the run is a stray and vanishes in the join.
          let segments = 0
          let inText = false
          for (const comment of current) {
            if (isBare(comment)) inText = false
            else if (!inText) {
              inText = true
              segments += 1
            }
          }
          const paragraphs = segments > 1
          const body = collapse(current.map((comment) => comment.value.trim()).join(' '))
          const text = asLine(body)
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
export const oneLineCommentsPlugin = {
  // No `version`: it feeds ESLint's cache key, and a hardcoded one drifts from package.json and serves stale cached results after a behaviour change.
  meta: { name: '@soujvnunes/eslint-config' },
  rules: { 'one-line-comments': oneLineComments },
}
