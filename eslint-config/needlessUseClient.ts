import {
  ASTUtils,
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils'
import globals from 'globals'
import { createClassifier } from './createClassifier'
import { findUseClientDirective } from './findUseClientDirective'
import { isNamespaceImport } from './isNamespaceImport'
import { jsxTagRoot } from './jsxTagRoot'
type Variable = TSESLint.Scope.Variable
const { DefinitionType } = TSESLint.Scope
const HOOK = /^use[A-Z]/u
const HANDLER = /^on[A-Z]/u
const COMPONENT = /^[A-Z]/u
const INTRINSIC = /^[a-z]/u
// A React 19 context renders as its own provider (`<SessionContext value>`), and a server component cannot create or provide one.
const PROVIDER = /(?:Context|Provider)$/u
const CLIENT_CALLS = new Set(['use', 'createContext'])
const CLIENT_MODULES = new Set(['next/dynamic', 'client-only'])
// Intrinsic attributes that take a function: a callback ref, and a form action that is a client function.
const FUNCTION_ATTRIBUTES = new Set(['ref', 'action', 'formAction'])
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
const attributeName = (attribute: TSESTree.JSXAttribute) =>
  attribute.name.type === AST_NODE_TYPES.JSXIdentifier ? attribute.name.name : attribute.name.name.name
// A value reference, since a type annotation that names a DOM type (`HTMLDivElement`) reads nothing at runtime; espree's references carry no flag and are all values.
const isValueReference = (reference: TSESLint.Scope.Reference) => reference.isValueReference !== false
export const needlessUseClient = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow a `'use client'` directive in a module with nothing that needs the client: no hook, no event handler, no browser global, no class component, no export but components, and only data handed to a component.",
    },
    schema: [],
    messages: {
      needless:
        "Nothing in this file needs `'use client'`: no hook call, no event handler, no browser global, no class component, no `next/dynamic` or `client-only`, no module-level side effect, no export but components, and every value it hands to a component is data a server parent could pass. A file without the directive still runs on the client when a client component imports it, so delete the line and let the importer decide. If a dependency without its own directive needs a boundary here, re-export it from this file, or disable this rule on the line with the reason.",
    },
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context
    const directive = findUseClientDirective(sourceCode.ast)
    if (!directive) return {}
    const classify = createClassifier(sourceCode, false)
    const isData = (node: TSESTree.Node) => classify(node, 'prop').data
    let needed = false
    const need = () => {
      needed = true
    }
    const variableOf = (node: TSESTree.Node, name: string) =>
      ASTUtils.findVariable(sourceCode.getScope(node), name)
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
    const isComponentDefault = (declaration: TSESTree.ExportDefaultDeclaration['declaration']) => {
      if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
        return COMPONENT.test(declaration.id?.name ?? '')
      if (declaration.type === AST_NODE_TYPES.CallExpression) return isComponentInit(declaration)
      if (declaration.type === AST_NODE_TYPES.Identifier)
        return isComponentVariable(variableOf(declaration, declaration.name))
      return false
    }
    const checkAttributes = (element: TSESTree.JSXOpeningElement, isIntrinsic: boolean) => {
      for (const attribute of element.attributes) {
        if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) {
          if (!isData(attribute.argument)) need()
        } else {
          const key = attributeName(attribute)
          const { value } = attribute
          // An intrinsic attribute other than these holds data or nothing, and a class name is a string by contract, so a call such as `cn()` there is data.
          const isChecked = isIntrinsic ? FUNCTION_ATTRIBUTES.has(key) : key !== 'className'
          if (HANDLER.test(key)) need()
          else if (
            isChecked &&
            value?.type === AST_NODE_TYPES.JSXExpressionContainer &&
            !isData(value.expression)
          )
            need()
        }
      }
    }
    return {
      'Program > ExpressionStatement'(node: TSESTree.ExpressionStatement) {
        // A call made at import time for its effect would run on the server for every server importer.
        if (node.directive === undefined) need()
      },
      ImportDeclaration(node) {
        if (CLIENT_MODULES.has(node.source.value) && node.importKind !== 'type') need()
      },
      CallExpression(node) {
        const name = calleeName(node.callee)
        if (name && (HOOK.test(name) || CLIENT_CALLS.has(name))) need()
      },
      'ClassDeclaration, ClassExpression'(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression) {
        if (node.superClass && CLASS_BASES.has(calleeName(node.superClass) ?? '')) need()
      },
      MemberExpression(node) {
        const { object, property } = node
        if (
          object.type === AST_NODE_TYPES.Identifier &&
          object.name === 'globalThis' &&
          !node.computed &&
          property.type === AST_NODE_TYPES.Identifier &&
          BROWSER_GLOBALS.has(property.name) &&
          !variableOf(object, 'globalThis')?.defs.length
        )
          need()
      },
      JSXOpeningElement(node) {
        const { name } = node
        const isIntrinsic = name.type === AST_NODE_TYPES.JSXIdentifier && INTRINSIC.test(name.name)
        if (name.type === AST_NODE_TYPES.JSXIdentifier && PROVIDER.test(name.name)) need()
        if (name.type === AST_NODE_TYPES.JSXMemberExpression) {
          const tag = jsxTagRoot(name)
          // One level into a namespace is a module export; dotting into anything else (`Ctx.Provider`, `motion.div`) reads into what may be a client reference, which a server component cannot do.
          if (!tag || tag.depth > 1 || !isNamespaceImport(variableOf(node, tag.root.name))) need()
        }
        checkAttributes(node, isIntrinsic)
      },
      JSXExpressionContainer(node) {
        // A child of a component is its `children` prop, which can carry a function; a child of a tag or a fragment renders in place and cannot.
        if (node.parent.type !== AST_NODE_TYPES.JSXElement) return
        const { name } = node.parent.openingElement
        if (name.type === AST_NODE_TYPES.JSXIdentifier && INTRINSIC.test(name.name)) return
        if (!isData(node.expression)) need()
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
          for (const specifier of node.specifiers)
            if (
              specifier.exportKind !== 'type' &&
              !isComponentVariable(variableOf(node, specifier.local.name))
            )
              need()
      },
      ExportDefaultDeclaration(node) {
        if (!isComponentDefault(node.declaration)) need()
      },
      'Program:exit'(node) {
        if (needed) return
        const scope = sourceCode.getScope(node)
        const readsBrowserGlobal =
          scope.through.some(
            (reference) =>
              isValueReference(reference) && BROWSER_GLOBALS.has(reference.identifier.name),
          ) ||
          scope.variables.some(
            (variable) =>
              variable.defs.length === 0 &&
              BROWSER_GLOBALS.has(variable.name) &&
              variable.references.some(isValueReference),
          )
        if (!readsBrowserGlobal) context.report({ node: directive, messageId: 'needless' })
      },
    }
  },
})
