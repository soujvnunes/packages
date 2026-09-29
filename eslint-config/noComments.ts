import type { AST, Rule, SourceCode } from 'eslint'
import {
  createCommentLookup,
  isBanner,
  isComment,
  isDocShaped,
  isToolDirective,
  spansLines,
} from './commentKinds'
import type { Comment, Enclosing } from './commentKinds'
type Lookup = ReturnType<typeof createCommentLookup>
type Kind =
  | 'directive'
  | 'banner'
  | 'jsdoc'
  | 'orphanDoc'
  | 'jsx'
  | 'jsxDirective'
  | 'attribute'
  | 'line'
  | 'block'
type Removal = { range: [number, number]; text: string; lines: [number, number] | null }
const EXPORTS = new Set(['ExportNamedDeclaration', 'ExportDefaultDeclaration', 'ExportAllDeclaration'])
const DOCUMENTED = new Set([
  'ClassDeclaration',
  'FunctionDeclaration',
  'TSDeclareFunction',
  'VariableDeclaration',
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration',
  'TSEnumDeclaration',
  'TSModuleDeclaration',
  'PropertyDefinition',
  'MethodDefinition',
  'TSAbstractPropertyDefinition',
  'TSAbstractMethodDefinition',
  'AccessorProperty',
  'TSAbstractAccessorProperty',
  'TSParameterProperty',
  'TSIndexSignature',
  'TSPropertySignature',
  'TSMethodSignature',
  'TSCallSignatureDeclaration',
  'TSConstructSignatureDeclaration',
  'TSEnumMember',
  'Property',
])
const BOUNDARIES = new Set(['Program', 'BlockStatement', 'StaticBlock', 'TSModuleBlock'])
const MEMBER_OPENERS = new Set(['{', ';', ','])
const EM_DASH = String.fromCodePoint(0x2014)
type Walked = NonNullable<Enclosing> & { body?: unknown }
const holdsTag = (comment: Comment) => /(?:^|\s)@\w/u.test(comment.value)
const isBoundary = (node: Walked, child: Walked) =>
  BOUNDARIES.has(node.type) || (node.type === 'ArrowFunctionExpression' && node.body === child)
const reachesExport = (start: Walked) => {
  let child = start
  let node: Walked | undefined = start.parent ?? undefined
  while (node) {
    if (EXPORTS.has(node.type)) return true
    if (isBoundary(node, child)) return false
    child = node
    node = node.parent ?? undefined
  }
  return false
}
const isExportedDoc = (
  comment: Comment,
  sourceCode: SourceCode,
  lookup: Lookup,
  decorated: Map<number, Enclosing>,
) => {
  const before = sourceCode.getTokenBefore(comment)
  if (
    before?.loc &&
    before.loc.end.line === comment.loc?.start.line &&
    !MEMBER_OPENERS.has(before.value)
  ) {
    return false
  }
  const token = sourceCode.getTokenAfter(comment)
  if (!token) return false
  const target = decorated.get(token.range[0])
  if (target?.type === 'ClassDeclaration' && EXPORTS.has(target.parent?.type ?? '')) return true
  let node = lookup.nodeAt(token.range[0])
  while (node?.range?.[0] === token.range[0]) {
    if (EXPORTS.has(node.type)) return true
    if (DOCUMENTED.has(node.type)) return reachesExport(node)
    node = node.parent ?? null
  }
  return false
}
const isJsxNode = (node: Enclosing) =>
  !!node && node.type.startsWith('JSX') && node.type !== 'JSXExpressionContainer'
const classify = (
  comment: Comment,
  sourceCode: SourceCode,
  lookup: Lookup,
  decorated: Map<number, Enclosing>,
): Kind => {
  const node = lookup.enclosingNode(comment)
  const inJsx = isJsxNode(node)
  if (isToolDirective(comment)) return inJsx ? 'jsxDirective' : 'directive'
  if (isBanner(comment)) return 'banner'
  if (inJsx) return node?.type === 'JSXEmptyExpression' ? 'jsx' : 'attribute'
  if (isDocShaped(comment)) {
    return isExportedDoc(comment, sourceCode, lookup, decorated) ? 'jsdoc' : 'orphanDoc'
  }
  return comment.type === 'Line' ? 'line' : 'block'
}
const MESSAGE_IDS: Record<Kind, string | null> = {
  directive: null,
  banner: null,
  jsxDirective: null,
  jsdoc: 'jsdoc',
  orphanDoc: 'orphanDoc',
  jsx: 'jsx',
  attribute: 'attribute',
  line: 'line',
  block: 'block',
}
export const noComments: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow comments in code, except tool directives and a JSDoc directly above an exported symbol.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: { jsdoc: { enum: ['exports', 'never'] } },
        additionalProperties: false,
      },
    ],
    messages: {
      line: 'Comments are not allowed in code. Delete this `//` comment: a reason the code cannot carry belongs in the README. Only tool directives and a JSDoc on an exported symbol stay.',
      block:
        'Comments are not allowed in code. Delete this block comment: a reason the code cannot carry belongs in the README. Only tool directives and a JSDoc on an exported symbol stay.',
      orphanDoc:
        'A JSDoc is allowed only directly above an exported symbol, or a member of an exported class, interface or type. Delete this one.',
      jsdoc: 'This config allows no JSDoc. Delete it.',
      jsx: 'Comments are not allowed in JSX. Delete this `{/* */}` container; only a tool directive stays.',
      attribute: 'Comments are not allowed inside a JSX tag. Delete this one.',
      emDash:
        'This JSDoc holds an em dash. Write a comma, a colon, parentheses or two sentences instead.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const { lines, text } = sourceCode
    const lookup = createCommentLookup(sourceCode)
    const decorated = new Map<number, Enclosing>()
    const jsdoc = (context.options[0] as { jsdoc?: 'exports' | 'never' } | undefined)?.jsdoc
    const lineStart = (line: number) => sourceCode.getIndexFromLoc({ line, column: 0 })
    const lineEnd = (line: number) => lineStart(line) + (lines[line - 1]?.length ?? 0)
    const wholeLines = (first: number, last: number): [number, number] => {
      if (last < lines.length) return [lineStart(first), lineStart(last + 1)]
      if (first > 1) return [lineEnd(first - 1), text.length]
      return [0, text.length]
    }
    const removal = (comment: Comment, kind: Kind): Removal | null => {
      if (kind === 'attribute' || ((kind === 'orphanDoc' || kind === 'jsdoc') && holdsTag(comment))) {
        return null
      }
      const span = lookup.jsxContainer(comment) ?? comment
      const side = lookup.sides(comment)
      const { range, loc } = span
      if (!range || !loc || !side) return null
      const { before, after } = side
      if (!before && !after) {
        const bounds: [number, number] = [loc.start.line, loc.end.line]
        return { range: wholeLines(...bounds), text: '', lines: bounds }
      }
      if (kind === 'jsx') return null
      const previousEnd = sourceCode.getTokenBefore(comment, { includeComments: true })?.range?.[1]
      const nextStart = sourceCode.getTokenAfter(comment, { includeComments: true })?.range?.[0]
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
      Decorator(node: Rule.Node) {
        if (node.range) decorated.set(node.range[0], node.parent as Enclosing)
      },
      'Program:exit'() {
        const reports: { comment: Comment; messageId: string; fix: Removal | null }[] = []
        for (const comment of sourceCode.getAllComments().filter(isComment)) {
          const kind = classify(comment, sourceCode, lookup, decorated)
          if (kind === 'jsdoc' && jsdoc !== 'never') {
            if (comment.value.includes(EM_DASH))
              reports.push({ comment, messageId: 'emDash', fix: null })
            continue
          }
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
            loc: comment.loc as AST.SourceLocation,
            messageId,
            fix: fix ? (fixer) => fixer.replaceTextRange(fix.range, fix.text) : null,
          })
        }
      },
    }
  },
}
