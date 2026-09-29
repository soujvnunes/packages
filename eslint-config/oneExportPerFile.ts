import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
type MessageId = 'multiple'
type Entry = { node: TSESTree.Node; name: string }
const isTypeOnlyDeclaration = (declaration: TSESTree.ExportNamedDeclaration['declaration']): boolean =>
  declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
  declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration
const declaratorEntries = (declaration: TSESTree.VariableDeclaration): Entry[] =>
  declaration.declarations.map((declarator) => ({
    node: declarator,
    name:
      declarator.id.type === AST_NODE_TYPES.Identifier ? declarator.id.name : 'a destructured export',
  }))
const declarationEntry = (
  declaration: NonNullable<TSESTree.ExportNamedDeclaration['declaration']>,
): Entry => ({
  node: declaration,
  name:
    'id' in declaration && declaration.id?.type === AST_NODE_TYPES.Identifier
      ? declaration.id.name
      : 'default',
})
const namedEntries = (node: TSESTree.ExportNamedDeclaration): Entry[] => {
  if (node.exportKind === 'type') return []
  const { declaration, specifiers } = node
  if (declaration) {
    if (isTypeOnlyDeclaration(declaration)) return []
    if (declaration.type === AST_NODE_TYPES.VariableDeclaration) return declaratorEntries(declaration)
    return [declarationEntry(declaration)]
  }
  return specifiers
    .filter((specifier) => specifier.exportKind !== 'type')
    .map((specifier) => ({
      node: specifier,
      name:
        specifier.exported.type === AST_NODE_TYPES.Identifier
          ? specifier.exported.name
          : specifier.exported.value,
    }))
}
const exportEntries = (statement: TSESTree.ProgramStatement): Entry[] => {
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) return namedEntries(statement)
  if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration)
    return [{ node: statement, name: 'default' }]
  return []
}
export const oneExportPerFile = ESLintUtils.RuleCreator.withoutDocs<[], MessageId>({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow more than one value export per module. A type export (an interface, a type alias, or a type-only named export) is free of the count.',
    },
    schema: [],
    messages: {
      multiple:
        'This module already exports `{{first}}`; give `{{name}}` its own module. A type export is free of this rule.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program) {
        const [first, ...rest] = program.body.flatMap(exportEntries)
        if (!first || rest.length === 0) return
        for (const entry of rest)
          context.report({
            node: entry.node,
            messageId: 'multiple',
            data: { first: first.name, name: entry.name },
          })
      },
    }
  },
})
