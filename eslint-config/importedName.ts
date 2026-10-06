import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'
const { DefinitionType } = TSESLint.Scope
export const importedName = (variable: TSESLint.Scope.Variable | null) => {
  const [def] = variable?.defs ?? []
  if (def?.type !== DefinitionType.ImportBinding || def.node.type !== AST_NODE_TYPES.ImportSpecifier)
    return ''
  const { imported } = def.node
  return imported.type === AST_NODE_TYPES.Identifier ? imported.name : imported.value
}
