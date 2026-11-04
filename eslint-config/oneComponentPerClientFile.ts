import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from '@typescript-eslint/utils'
import { BROWSER_GLOBALS } from './browserGlobals'
import { createClassifier } from './createClassifier'
import { createClientWalk } from './createClientWalk'
import { findUseClientDirective } from './findUseClientDirective'
import { isComponentFunction } from './isComponentFunction'
import { isComponentWrapper } from './isComponentWrapper'
type MessageId = 'extra'
type FunctionNode =
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration
type Candidate = { node: TSESTree.Node; fn: FunctionNode; name: string; isExported: boolean }
const unwrap = (node: TSESTree.Node | null | undefined): TSESTree.Node | null => {
  if (!node) return null
  if (!isComponentWrapper(node)) return node
  if (node.type === AST_NODE_TYPES.CallExpression) return unwrap(node.arguments[0])
  if (node.type === AST_NODE_TYPES.TSAsExpression || node.type === AST_NODE_TYPES.TSSatisfiesExpression)
    return unwrap(node.expression)
  return node
}
const functionOf = (init: TSESTree.Node | null | undefined) => {
  const node = unwrap(init)
  return node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node?.type === AST_NODE_TYPES.FunctionExpression
    ? node
    : null
}
const declarationCandidates = (declaration: TSESTree.Node, isExported: boolean): Candidate[] => {
  if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
    return [{ node: declaration, fn: declaration, name: declaration.id?.name ?? 'default', isExported }]
  if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return []
  return declaration.declarations.flatMap((declarator) => {
    const fn = functionOf(declarator.init)
    if (!fn || declarator.id.type !== AST_NODE_TYPES.Identifier) return []
    return [{ node: declarator, fn, name: declarator.id.name, isExported }]
  })
}
const statementCandidates = (statement: TSESTree.ProgramStatement): Candidate[] => {
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration)
    return statement.declaration ? declarationCandidates(statement.declaration, true) : []
  if (statement.type !== AST_NODE_TYPES.ExportDefaultDeclaration)
    return declarationCandidates(statement, false)
  const { declaration } = statement
  if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
    return declarationCandidates(declaration, true)
  const fn = functionOf(declaration)
  return fn ? [{ node: statement, fn, name: 'default', isExported: true }] : []
}
const exportedLocalNames = (statement: TSESTree.ProgramStatement): string[] => {
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && statement.exportKind === 'type')
    return []
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && !statement.source)
    return statement.specifiers.flatMap((specifier) =>
      specifier.exportKind !== 'type' && specifier.local.type === AST_NODE_TYPES.Identifier
        ? [specifier.local.name]
        : [],
    )
  if (statement.type !== AST_NODE_TYPES.ExportDefaultDeclaration) return []
  const target = unwrap(statement.declaration)
  return target?.type === AST_NODE_TYPES.Identifier ? [target.name] : []
}
export const oneComponentPerClientFile = ESLintUtils.RuleCreator.withoutDocs<[], MessageId>({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a module-level function beside the one exported component of a client module, unless its own body needs the browser.',
    },
    schema: [],
    messages: {
      extra:
        'This client file exports `{{component}}`; `{{name}}` is a second function that needs no browser of its own. Move it to its own module (a pure function under utils/, a hook under lib/), or render static markup in the server parent and pass it in as children.',
    },
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context
    return {
      Program(program) {
        if (!findUseClientDirective(program)) return
        const exportedNames = new Set(program.body.flatMap(exportedLocalNames))
        const candidates = program.body
          .flatMap(statementCandidates)
          .map((candidate) => ({
            ...candidate,
            isExported: candidate.isExported || exportedNames.has(candidate.name),
          }))
        const component = candidates.find(
          (candidate) => candidate.isExported && isComponentFunction(candidate.fn),
        )
        if (!component) return
        const walk = createClientWalk(sourceCode, createClassifier(sourceCode, false))
        const readsBrowserGlobal = (fn: FunctionNode) =>
          sourceCode
            .getScope(fn)
            .through.some(
              (reference) =>
                reference.isValueReference !== false &&
                BROWSER_GLOBALS.has(reference.identifier.name) &&
                !reference.resolved?.defs.length,
            )
        for (const candidate of candidates) {
          if (candidate === component || walk(candidate.fn) || readsBrowserGlobal(candidate.fn))
            continue
          context.report({
            node: candidate.node,
            messageId: 'extra',
            data: { component: component.name, name: candidate.name },
          })
        }
      },
    }
  },
})
