import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import {
  createCommentLookup,
  holdsTag,
  isBanner,
  isComment,
  isDocShaped,
  isToolDirective,
  isTypeAnnotation,
  spansLines,
} from './commentKinds'
import type { Comment, Enclosing } from './commentKinds'
type Lookup = ReturnType<typeof createCommentLookup>
type SourceCode = Readonly<TSESLint.SourceCode>
type Kind =
  | 'directive'
  | 'banner'
  | 'jsdoc'
  | 'orphanDoc'
  | 'argumentDoc'
  | 'jsx'
  | 'jsxDirective'
  | 'attribute'
  | 'line'
  | 'block'
type Removal = { range: [number, number]; text: string; lines: [number, number] | null }
type Node = TSESTree.Node
type TopLevel = (statement: Node) => boolean
type Walk = { topLevel: TopLevel; throughCalls: boolean }
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
const DECLARATION_FILE = /\.d\.[cm]?ts$/u
const EM_DASH = String.fromCodePoint(0x2014)
const identifierName = (node: Node | null | undefined) =>
  node?.type === AST_NODE_TYPES.Identifier ? node.name : undefined
const isModuleExports = (node: Node) =>
  node.type === AST_NODE_TYPES.MemberExpression &&
  identifierName(node.object) === 'module' &&
  identifierName(node.property) === 'exports'
const commonJsExport = (statement: Node) => {
  if (statement.type !== AST_NODE_TYPES.ExpressionStatement) return null
  const { expression } = statement
  if (expression.type !== AST_NODE_TYPES.AssignmentExpression) return null
  const { left, right } = expression
  if (left.type !== AST_NODE_TYPES.MemberExpression) return null
  const exported =
    isModuleExports(left) || identifierName(left.object) === 'exports' || isModuleExports(left.object)
  return exported ? right : null
}
const deferredExports = (body: TSESTree.ProgramStatement[]) => {
  const names = new Set<string>()
  const add = (node: Node | null) => {
    const name = identifierName(node)
    if (name) names.add(name)
  }
  for (const statement of body) {
    const commonJs = commonJsExport(statement)
    if (commonJs?.type === AST_NODE_TYPES.ObjectExpression) {
      for (const property of commonJs.properties) {
        if (property.type === AST_NODE_TYPES.Property) add(property.value)
      }
    } else add(commonJs)
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
const boundNames = (node: Node | null): string[] => {
  if (node?.type === AST_NODE_TYPES.Identifier) return [node.name]
  if (node?.type === AST_NODE_TYPES.ObjectPattern) {
    return node.properties.flatMap((property) =>
      boundNames(property.type === AST_NODE_TYPES.RestElement ? property.argument : property.value),
    )
  }
  if (node?.type === AST_NODE_TYPES.ArrayPattern) {
    return node.elements.flatMap((element) => boundNames(element))
  }
  if (node?.type === AST_NODE_TYPES.AssignmentPattern) return boundNames(node.left)
  if (node?.type === AST_NODE_TYPES.RestElement) return boundNames(node.argument)
  return []
}
const isDeferred = (statement: Node, deferred: Set<string>) =>
  declaredIds(statement).some((id) => boundNames(id).some((name) => deferred.has(name)))
const isModuleFile = (program: TSESTree.Program) =>
  program.body.some(
    (statement) =>
      MODULE_STATEMENTS.has(statement.type) ||
      commonJsExport(statement) !== null ||
      (statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration &&
        statement.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference),
  )
const isAmbient = (statement: Node) =>
  statement.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
  statement.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
  ('declare' in statement && statement.declare === true)
const ambience = (block: TSESTree.TSModuleBlock) => {
  let declared = false
  let node: Node | undefined = block.parent
  while (node) {
    if (node.type === AST_NODE_TYPES.TSModuleDeclaration) {
      if (node.kind === 'global' || node.id.type === AST_NODE_TYPES.Literal) return 'public'
      declared ||= node.declare
    }
    node = node.parent
  }
  return declared ? 'declared' : 'local'
}
const isBoundary = (node: Node, child: Node, walk: Walk) =>
  BOUNDARIES.has(node.type) ||
  (node.type === AST_NODE_TYPES.ArrowFunctionExpression && node.body === child) ||
  (!walk.throughCalls &&
    (node.type === AST_NODE_TYPES.CallExpression || node.type === AST_NODE_TYPES.NewExpression) &&
    node.arguments.some((argument) => argument === child))
const isPublished = (statement: Node, walk: Walk): boolean => {
  const { parent } = statement
  if (parent?.type !== AST_NODE_TYPES.TSModuleBlock) return true
  return ambience(parent) === 'public' || reachesExport(parent.parent, walk)
}
const reachesExport = (start: Node, walk: Walk) => {
  let child = start
  let node: Node | undefined = start.parent
  while (node) {
    if (EXPORTS.has(node.type)) return isPublished(node, walk)
    if (node.type === AST_NODE_TYPES.TSModuleBlock) {
      const scope = ambience(node)
      if (scope !== 'declared') return scope === 'public'
    }
    if (node.type === AST_NODE_TYPES.Program) return walk.topLevel(child)
    if (isBoundary(node, child, walk)) return false
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
  walk: Walk,
) => {
  const before = sourceCode.getTokenBefore(comment)
  if (before?.loc.end.line === comment.loc.start.line && !MEMBER_OPENERS.has(before.value)) {
    return false
  }
  const token = sourceCode.getTokenAfter(comment)
  if (!token) return false
  const target = decorated.get(token.range[0])
  if (target?.type === AST_NODE_TYPES.ClassDeclaration && reachesExport(target, walk)) {
    return true
  }
  let node = lookup.nodeAt(token.range[0])
  while (node?.range[0] === token.range[0]) {
    if (EXPORTS.has(node.type)) return isPublished(node, walk)
    if (DOCUMENTED.has(node.type)) return reachesExport(node, walk)
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
  topLevel: TopLevel,
): Kind => {
  const node = lookup.enclosingNode(comment)
  const inJsx = isJsxNode(node)
  if (isToolDirective(comment) || lookup.isAllowMarker(comment)) {
    return inJsx ? 'jsxDirective' : 'directive'
  }
  if (isBanner(comment)) return 'banner'
  if (inJsx) return node?.type === AST_NODE_TYPES.JSXEmptyExpression ? 'jsx' : 'attribute'
  if (isDocShaped(comment)) {
    const reaches = (throughCalls: boolean) =>
      isExportedDoc(comment, sourceCode, lookup, decorated, { topLevel, throughCalls })
    if (reaches(false)) return 'jsdoc'
    return reaches(true) ? 'argumentDoc' : 'orphanDoc'
  }
  return comment.type === AST_TOKEN_TYPES.Line ? 'line' : 'block'
}
const MESSAGES = {
  line: 'Comments are not allowed in code. Delete this `//` comment: a reason the code cannot carry belongs in the README. Only tool directives and a JSDoc on an exported symbol stay.',
  block:
    'Comments are not allowed in code. Delete this block comment: a reason the code cannot carry belongs in the README. Only tool directives and a JSDoc on an exported symbol stay.',
  orphanDoc:
    'A JSDoc is allowed only directly above an exported symbol, or a member of an exported class, interface, type or enum. Delete this one.',
  argumentDoc:
    "This JSDoc sits in an argument of an exported call or `new`, so it is published only when the callee returns its argument's type, as `Object.freeze` or a generic identity helper does. The rule cannot see the signature: delete it unless the callee keeps it.",
  jsdoc: 'This config allows no JSDoc. Delete it.',
  jsx: 'Comments are not allowed in JSX. Delete this `{/* */}` container; only a tool directive stays.',
  attribute: 'Comments are not allowed inside a JSX tag. Delete this one.',
  emDash: 'This JSDoc holds an em dash. Write a comma, a colon, parentheses or two sentences instead.',
}
type MessageId = keyof typeof MESSAGES
type Options = [{ jsdoc?: 'exports' | 'never' }]
const MESSAGE_IDS: Record<Kind, MessageId | null> = {
  directive: null,
  banner: null,
  jsxDirective: null,
  jsdoc: 'jsdoc',
  orphanDoc: 'orphanDoc',
  argumentDoc: 'argumentDoc',
  jsx: 'jsx',
  attribute: 'attribute',
  line: 'line',
  block: 'block',
}
export const noComments = ESLintUtils.RuleCreator.withoutDocs<Options, MessageId>({
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
        properties: { jsdoc: { type: 'string', enum: ['exports', 'never'] } },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES,
  },
  defaultOptions: [{}],
  create(context, [{ jsdoc }]) {
    const sourceCode = context.sourceCode
    const { lines, text } = sourceCode
    const lookup = createCommentLookup(sourceCode)
    const decorated = new Map<number, Node>()
    const program = sourceCode.ast
    const deferred = deferredExports(program.body)
    const globalScope = !isModuleFile(program)
    const declarationFile = DECLARATION_FILE.test(context.filename)
    const topLevel: TopLevel = (statement) =>
      isDeferred(statement, deferred) || (globalScope && (declarationFile || isAmbient(statement)))
    const typedJs = JS_FILE.test(context.filename)
    const lineStart = (line: number) => sourceCode.getIndexFromLoc({ line, column: 0 })
    const lineEnd = (line: number) => lineStart(line) + (lines[line - 1]?.length ?? 0)
    const wholeLines = (first: number, last: number): [number, number] => {
      if (last < lines.length) return [lineStart(first), lineStart(last + 1)]
      if (first > 1) return [lineEnd(first - 1), text.length]
      return [0, text.length]
    }
    const removal = (comment: Comment, kind: Kind): Removal | null => {
      if (
        kind === 'attribute' ||
        kind === 'argumentDoc' ||
        ((kind === 'orphanDoc' || kind === 'jsdoc') && holdsTag(comment))
      ) {
        return null
      }
      const span = lookup.jsxContainer(comment) ?? comment
      const side = lookup.sides(comment)
      const { range, loc } = span
      const { before, after } = side
      if (!before && !after) {
        const bounds: [number, number] = [loc.start.line, loc.end.line]
        return { range: wholeLines(...bounds), text: '', lines: bounds }
      }
      if (kind === 'jsx') return null
      const previousEnd = sourceCode.getTokenBefore(comment, { includeComments: true })?.range[1]
      const nextStart = sourceCode.getTokenAfter(comment, { includeComments: true })?.range[0]
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
      Decorator(decorator) {
        const { parent } = decorator
        if ('decorators' in parent && parent.decorators[0] === decorator) {
          decorated.set(decorator.range[0], parent)
        }
      },
      'Program:exit'() {
        const reports: { comment: Comment; messageId: MessageId; fix: Removal | null }[] = []
        for (const comment of sourceCode.getAllComments().filter(isComment)) {
          const kind: Kind =
            typedJs && isTypeAnnotation(comment)
              ? 'directive'
              : classify(comment, sourceCode, lookup, decorated, topLevel)
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
            loc: comment.loc,
            messageId,
            fix: fix ? (fixer) => fixer.replaceTextRange(fix.range, fix.text) : null,
          })
        }
      },
    }
  },
})
