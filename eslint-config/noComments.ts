import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils'
import type { AST, Rule, SourceCode } from 'eslint'
import {
  createCommentLookup,
  isBanner,
  isComment,
  isDocShaped,
  isToolDirective,
  isTypeAnnotation,
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
type Node = TSESTree.Node
const EXPORTS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportAllDeclaration,
])
const DOCUMENTED = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ClassDeclaration,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.TSDeclareFunction,
  AST_NODE_TYPES.VariableDeclaration,
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.TSEnumDeclaration,
  AST_NODE_TYPES.TSModuleDeclaration,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.TSAbstractPropertyDefinition,
  AST_NODE_TYPES.TSAbstractMethodDefinition,
  AST_NODE_TYPES.AccessorProperty,
  AST_NODE_TYPES.TSAbstractAccessorProperty,
  AST_NODE_TYPES.TSParameterProperty,
  AST_NODE_TYPES.TSIndexSignature,
  AST_NODE_TYPES.TSPropertySignature,
  AST_NODE_TYPES.TSMethodSignature,
  AST_NODE_TYPES.TSCallSignatureDeclaration,
  AST_NODE_TYPES.TSConstructSignatureDeclaration,
  AST_NODE_TYPES.TSEnumMember,
  AST_NODE_TYPES.Property,
])
const BOUNDARIES = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.BlockStatement,
  AST_NODE_TYPES.StaticBlock,
])
const MODULE_STATEMENTS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ImportDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportAllDeclaration,
  AST_NODE_TYPES.TSExportAssignment,
])
const MEMBER_OPENERS = new Set(['{', ';', ','])
const JS_FILE = /\.[cm]?jsx?$/u
const EM_DASH = String.fromCodePoint(0x2014)
const identifierName = (node: Node | null | undefined) =>
  node?.type === AST_NODE_TYPES.Identifier ? node.name : undefined
const deferredExports = (body: TSESTree.ProgramStatement[]) => {
  const names = new Set<string>()
  const add = (node: Node | null) => {
    const name = identifierName(node)
    if (name) names.add(name)
  }
  for (const statement of body) {
    if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && !statement.source) {
      for (const { local } of statement.specifiers) add(local)
    }
    if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) add(statement.declaration)
    if (statement.type === AST_NODE_TYPES.TSExportAssignment) add(statement.expression)
  }
  return names
}
const declaredIds = (statement: Node): (Node | null)[] => {
  if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
    return statement.declarations.map(({ id }) => id)
  }
  return 'id' in statement ? [statement.id] : []
}
const isDeferred = (statement: Node, deferred: Set<string>) =>
  declaredIds(statement).some((id) => {
    const name = identifierName(id)
    return !!name && deferred.has(name)
  })
const holdsTag = (comment: Comment) => /(?:^|\s)@\w/u.test(comment.value)
const moduleFiles = new WeakMap<TSESTree.Program, boolean>()
const isModuleFile = (program: TSESTree.Program) => {
  const known = moduleFiles.get(program)
  if (known !== undefined) return known
  const verdict = program.body.some(
    (statement) =>
      MODULE_STATEMENTS.has(statement.type) ||
      (statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration &&
        statement.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference),
  )
  moduleFiles.set(program, verdict)
  return verdict
}
const ambience = (block: TSESTree.TSModuleBlock) => {
  let declared = false
  let node: Node | undefined = block.parent
  while (node) {
    if (node.type === AST_NODE_TYPES.TSModuleDeclaration) {
      if (node.kind === 'global' || node.id.type === AST_NODE_TYPES.Literal) return 'public'
      declared ||= node.declare
    }
    if (node.type === AST_NODE_TYPES.Program && declared && !isModuleFile(node)) return 'public'
    node = node.parent
  }
  return declared ? 'declared' : 'local'
}
const isBoundary = (node: Node, child: Node) =>
  BOUNDARIES.has(node.type) ||
  (node.type === AST_NODE_TYPES.ArrowFunctionExpression && node.body === child) ||
  ((node.type === AST_NODE_TYPES.CallExpression || node.type === AST_NODE_TYPES.NewExpression) &&
    node.arguments.some((argument) => argument === child))
const isPublished = (statement: Node, deferred: Set<string>): boolean => {
  const { parent } = statement
  if (parent?.type !== AST_NODE_TYPES.TSModuleBlock) return true
  return ambience(parent) === 'public' || reachesExport(parent.parent, deferred)
}
const reachesExport = (start: Node, deferred: Set<string>) => {
  let child = start
  let node: Node | undefined = start.parent
  while (node) {
    if (EXPORTS.has(node.type)) return isPublished(node, deferred)
    if (node.type === AST_NODE_TYPES.TSModuleBlock) {
      const scope = ambience(node)
      if (scope !== 'declared') return scope === 'public'
    }
    if (node.type === AST_NODE_TYPES.Program) return isDeferred(child, deferred)
    if (isBoundary(node, child)) return false
    child = node
    node = node.parent
  }
  return false
}
const isExportedDoc = (
  comment: Comment,
  sourceCode: SourceCode,
  lookup: Lookup,
  decorated: Map<number, Node>,
  deferred: Set<string>,
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
  if (
    target?.type === AST_NODE_TYPES.ClassDeclaration &&
    ((EXPORTS.has(target.parent.type) && isPublished(target.parent, deferred)) ||
      isDeferred(target, deferred))
  ) {
    return true
  }
  let node = lookup.nodeAt(token.range[0])
  while (node?.range[0] === token.range[0]) {
    if (EXPORTS.has(node.type)) return isPublished(node, deferred)
    if (DOCUMENTED.has(node.type)) return reachesExport(node, deferred)
    node = node.parent ?? null
  }
  return false
}
const isJsxNode = (node: Enclosing) =>
  !!node && node.type.startsWith('JSX') && node.type !== AST_NODE_TYPES.JSXExpressionContainer
const classify = (
  comment: Comment,
  sourceCode: SourceCode,
  lookup: Lookup,
  decorated: Map<number, Node>,
  deferred: Set<string>,
): Kind => {
  const node = lookup.enclosingNode(comment)
  const inJsx = isJsxNode(node)
  if (isToolDirective(comment) || lookup.isAllowMarker(comment)) {
    return inJsx ? 'jsxDirective' : 'directive'
  }
  if (isBanner(comment)) return 'banner'
  if (inJsx) return node?.type === AST_NODE_TYPES.JSXEmptyExpression ? 'jsx' : 'attribute'
  if (isDocShaped(comment)) {
    return isExportedDoc(comment, sourceCode, lookup, decorated, deferred) ? 'jsdoc' : 'orphanDoc'
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
        'Disallow comments in code, except tool directives and a JSDoc directly above an exported symbol or a member of an exported class, interface, type or enum.',
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
        'A JSDoc is allowed only directly above an exported symbol, or a member of an exported class, interface, type or enum. Delete this one.',
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
    const decorated = new Map<number, Node>()
    const program = sourceCode.ast as unknown as TSESTree.Program
    const deferred = deferredExports(program.body)
    const typedJs = JS_FILE.test(context.filename)
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
        const decorator = node as unknown as TSESTree.Decorator
        const { parent } = decorator
        if ('decorators' in parent && parent.decorators[0] === decorator) {
          decorated.set(decorator.range[0], parent)
        }
      },
      'Program:exit'() {
        const reports: { comment: Comment; messageId: string; fix: Removal | null }[] = []
        for (const comment of sourceCode.getAllComments().filter(isComment)) {
          const kind: Kind =
            typedJs && isTypeAnnotation(comment)
              ? 'directive'
              : classify(comment, sourceCode, lookup, decorated, deferred)
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
