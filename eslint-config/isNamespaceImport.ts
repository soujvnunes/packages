import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'
import { everyDef } from './everyDef'
const { DefinitionType } = TSESLint.Scope
const NAMESPACE_PACKAGES = new Set(['radix-ui'])
/** Whether a binding is a module namespace, whose members are that module's exports: `import * as X`, or a named import from a package that exports namespaces. */
export const isNamespaceImport = (variable: TSESLint.Scope.Variable | null) =>
  everyDef(
    variable,
    (def) =>
      def.type === DefinitionType.ImportBinding &&
      (def.node.type === AST_NODE_TYPES.ImportNamespaceSpecifier ||
        (def.node.type === AST_NODE_TYPES.ImportSpecifier &&
          def.parent.type === AST_NODE_TYPES.ImportDeclaration &&
          NAMESPACE_PACKAGES.has(def.parent.source.value))),
  )
