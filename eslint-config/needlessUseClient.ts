import {
  ASTUtils,
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils'
import globals from 'globals'
import { findUseClientDirective } from './findUseClientDirective'
type Variable = TSESLint.Scope.Variable
const { DefinitionType } = TSESLint.Scope
const HOOK = /^use[A-Z]/u
const HANDLER = /^on[A-Z]/u
const COMPONENT = /^[A-Z]/u
const CLIENT_CALLS = new Set(['use', 'createContext'])
const CLASS_BASES = new Set(['Component', 'PureComponent'])
const COMPONENT_WRAPPERS = new Set(['memo', 'forwardRef'])
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
])
const TYPE_DECLARATIONS = new Set<string>([
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.TSDeclareFunction,
])
// Names a browser defines and Node does not, so reading one at render or in an effect is a real reason for the directive; the three added by hand are ones recent Node defines too, while no server render can use them for the visitor.
const BROWSER_GLOBALS = new Set([
  ...Object.keys(globals.browser).filter(
    (name) => !Object.hasOwn(globals.node, name) && !Object.hasOwn(globals.builtin, name),
  ),
  'navigator',
  'localStorage',
  'sessionStorage',
])
const calleeName = (callee: TSESTree.Node) => {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  )
    return callee.property.name
  return undefined
}
const isComponentInit = (init: TSESTree.Node | null): boolean => {
  if (!init) return false
  if (FUNCTIONS.has(init.type)) return true
  if (init.type === AST_NODE_TYPES.CallExpression)
    return COMPONENT_WRAPPERS.has(calleeName(init.callee) ?? '')
  if (init.type === AST_NODE_TYPES.TSAsExpression || init.type === AST_NODE_TYPES.TSSatisfiesExpression)
    return isComponentInit(init.expression)
  return false
}
const isComponentVariable = (variable: Variable | null) =>
  !!variable &&
  variable.defs.length > 0 &&
  variable.defs.every(
    (def) =>
      def.type === DefinitionType.Type ||
      (COMPONENT.test(variable.name) &&
        (def.type === DefinitionType.FunctionName ||
          (def.type === DefinitionType.Variable && isComponentInit(def.node.init)))),
  )
const isNamespaceImport = (variable: Variable | null) =>
  !!variable &&
  variable.defs.length > 0 &&
  variable.defs.every(
    (def) =>
      def.type === DefinitionType.ImportBinding &&
      def.node.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
  )
export const needlessUseClient = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow a `'use client'` directive in a module with nothing that needs the client: no hook, no event handler, no browser global, no class component, no export but components, and only data handed to JSX.",
    },
    schema: [],
    messages: {
      needless:
        "Nothing in this file needs `'use client'`: no hook call, no event handler, no browser global, no class component, no `next/dynamic`, no export but components, and every value it hands to JSX is data a server parent could pass. A file without the directive still runs on the client when a client component imports it, so delete the line and let the importer decide. If a dependency without its own directive needs a boundary here, re-export it from this file, or disable this rule on the line with the reason.",
    },
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context
    const directive = findUseClientDirective(sourceCode.ast)
    if (!directive) return {}
    let needed = false
    const need = () => {
      needed = true
    }
    const variableOf = (node: TSESTree.Node, name: string) =>
      ASTUtils.findVariable(sourceCode.getScope(node), name)
    const resolving = new Set<Variable>()
    // A binding a server parent could pass across the boundary itself: a prop it received, or a value built only from data. A cycle, a global or an import proves nothing, so each counts as a need.
    const isDataVariable = (variable: Variable | null): boolean => {
      if (!variable || variable.defs.length === 0 || resolving.has(variable)) return false
      resolving.add(variable)
      const isDataBinding = variable.defs.every(
        (def) =>
          def.type === DefinitionType.Parameter ||
          (def.type === DefinitionType.Variable && isData(def.node.init)),
      )
      resolving.delete(variable)
      return isDataBinding
    }
    const isData = (node: TSESTree.Node | null): boolean => {
      if (!node) return false
      switch (node.type) {
        case AST_NODE_TYPES.Literal:
        case AST_NODE_TYPES.TemplateLiteral:
        case AST_NODE_TYPES.JSXElement:
        case AST_NODE_TYPES.JSXFragment:
        case AST_NODE_TYPES.UnaryExpression:
        case AST_NODE_TYPES.BinaryExpression:
          return true
        case AST_NODE_TYPES.LogicalExpression:
          return isData(node.left) && isData(node.right)
        case AST_NODE_TYPES.ConditionalExpression:
          return isData(node.consequent) && isData(node.alternate)
        case AST_NODE_TYPES.ArrayExpression:
          return node.elements.every(
            (element) =>
              !element ||
              isData(element.type === AST_NODE_TYPES.SpreadElement ? element.argument : element),
          )
        case AST_NODE_TYPES.ObjectExpression:
          return node.properties.every((property) =>
            property.type === AST_NODE_TYPES.SpreadElement
              ? isData(property.argument)
              : property.kind === 'init' && !property.method && isData(property.value),
          )
        case AST_NODE_TYPES.MemberExpression:
          return isData(node.object)
        case AST_NODE_TYPES.ChainExpression:
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
        case AST_NODE_TYPES.TSNonNullExpression:
          return isData(node.expression)
        case AST_NODE_TYPES.Identifier:
          return node.name === 'undefined' || isDataVariable(variableOf(node, node.name))
        default:
          return false
      }
    }
    const exportsOnlyComponents = (declaration: TSESTree.NamedExportDeclarations) => {
      if (TYPE_DECLARATIONS.has(declaration.type)) return true
      if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
        return COMPONENT.test(declaration.id?.name ?? '')
      if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return false
      return declaration.declarations.every(
        (declarator) =>
          declarator.id.type === AST_NODE_TYPES.Identifier &&
          COMPONENT.test(declarator.id.name) &&
          isComponentInit(declarator.init),
      )
    }
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'next/dynamic' && node.importKind !== 'type') need()
      },
      CallExpression(node) {
        const name = calleeName(node.callee)
        if (name && (HOOK.test(name) || CLIENT_CALLS.has(name))) need()
      },
      'ClassDeclaration, ClassExpression'(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) {
        if (node.superClass && CLASS_BASES.has(calleeName(node.superClass) ?? '')) need()
      },
      JSXOpeningElement(node) {
        if (node.name.type !== AST_NODE_TYPES.JSXMemberExpression) return
        let root: TSESTree.JSXTagNameExpression = node.name.object
        let depth = 1
        while (root.type === AST_NODE_TYPES.JSXMemberExpression) {
          root = root.object
          depth += 1
        }
        // One level into a namespace import is a module export; dotting into anything else (`Ctx.Provider`, `motion.div`) reads into what may be a client reference, which a server component cannot do.
        if (
          root.type !== AST_NODE_TYPES.JSXIdentifier ||
          depth > 1 ||
          !isNamespaceImport(variableOf(node, root.name))
        )
          need()
      },
      JSXAttribute(node) {
        const name =
          node.name.type === AST_NODE_TYPES.JSXIdentifier ? node.name.name : node.name.name.name
        if (HANDLER.test(name)) {
          need()
          return
        }
        const { value } = node
        if (value?.type !== AST_NODE_TYPES.JSXExpressionContainer) return
        // A class name is a string by contract, so a call such as `cn()` there is data.
        if (name === 'className' || value.expression.type === AST_NODE_TYPES.JSXEmptyExpression) return
        if (!isData(value.expression)) need()
      },
      JSXSpreadAttribute(node) {
        if (!isData(node.argument)) need()
      },
      JSXExpressionContainer(node) {
        if (
          node.parent.type !== AST_NODE_TYPES.JSXElement &&
          node.parent.type !== AST_NODE_TYPES.JSXFragment
        )
          return
        const { expression } = node
        if (
          FUNCTIONS.has(expression.type) ||
          (expression.type === AST_NODE_TYPES.Identifier && !isData(expression))
        )
          need()
      },
      ExportAllDeclaration(node) {
        if (node.exportKind !== 'type') need()
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return
        // A value re-exported from another module is how a boundary goes around a dependency that ships no directive.
        if (node.source) need()
        else if (node.declaration) {
          if (!exportsOnlyComponents(node.declaration)) need()
        } else
          for (const specifier of node.specifiers) {
            if (
              specifier.exportKind !== 'type' &&
              !isComponentVariable(variableOf(node, specifier.local.name))
            )
              need()
          }
      },
      ExportDefaultDeclaration(node) {
        const { declaration } = node
        if (declaration.type === AST_NODE_TYPES.FunctionDeclaration || isComponentInit(declaration))
          return
        if (
          declaration.type === AST_NODE_TYPES.Identifier &&
          isComponentVariable(variableOf(node, declaration.name))
        )
          return
        need()
      },
      'Program:exit'(node) {
        if (needed) return
        const scope = sourceCode.getScope(node)
        const readsBrowserGlobal =
          scope.through.some((reference) => BROWSER_GLOBALS.has(reference.identifier.name)) ||
          scope.variables.some(
            (variable) =>
              variable.defs.length === 0 &&
              variable.references.length > 0 &&
              BROWSER_GLOBALS.has(variable.name),
          )
        if (!readsBrowserGlobal) context.report({ node: directive, messageId: 'needless' })
      },
    }
  },
})
