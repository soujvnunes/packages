import { AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils'
import globals from 'globals'
import { calleeName } from './calleeName'
import { childNodes } from './childNodes'
import { createClassifier } from './createClassifier'
import { isComponentInit } from './isComponentInit'
import { isComponentName } from './isComponentName'
import { isComponentWrapperCall } from './isComponentWrapperCall'
import { isEventHandler } from './isEventHandler'
import { isFunctionAttribute } from './isFunctionAttribute'
const { DefinitionType } = TSESLint.Scope
const HOOK = /^use[A-Z]/u
const STYLESHEET = /\.(?:css|scss|sass|less)$/u
const CLIENT_CALLS = new Set(['use', 'createContext', 'createPortal', 'flushSync'])
const CLIENT_MODULES = new Set(['next/dynamic', 'client-only'])
const CLASS_BASES = new Set(['Component', 'PureComponent'])
// Calls known to build a value and do nothing else, so running one at module level is as safe on the server as a literal.
const PURE_CALLS = new Set(['cva', 'tv'])
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
])
// Node types whose evaluation runs nothing beyond evaluating their children; a function's body is not run on import, and a member read or a call is judged on its own.
const INERT_TYPES = new Set<string>([
  AST_NODE_TYPES.Literal,
  AST_NODE_TYPES.TemplateLiteral,
  AST_NODE_TYPES.TemplateElement,
  AST_NODE_TYPES.Identifier,
  AST_NODE_TYPES.UnaryExpression,
  AST_NODE_TYPES.BinaryExpression,
  AST_NODE_TYPES.LogicalExpression,
  AST_NODE_TYPES.ConditionalExpression,
  AST_NODE_TYPES.ArrayExpression,
  AST_NODE_TYPES.ObjectExpression,
  AST_NODE_TYPES.Property,
  AST_NODE_TYPES.SpreadElement,
  AST_NODE_TYPES.RestElement,
  AST_NODE_TYPES.ObjectPattern,
  AST_NODE_TYPES.ArrayPattern,
  AST_NODE_TYPES.AssignmentPattern,
  AST_NODE_TYPES.JSXElement,
  AST_NODE_TYPES.JSXFragment,
  AST_NODE_TYPES.JSXOpeningElement,
  AST_NODE_TYPES.JSXClosingElement,
  AST_NODE_TYPES.JSXOpeningFragment,
  AST_NODE_TYPES.JSXClosingFragment,
  AST_NODE_TYPES.JSXAttribute,
  AST_NODE_TYPES.JSXSpreadAttribute,
  AST_NODE_TYPES.JSXExpressionContainer,
  AST_NODE_TYPES.JSXEmptyExpression,
  AST_NODE_TYPES.JSXText,
  AST_NODE_TYPES.JSXIdentifier,
  AST_NODE_TYPES.JSXNamespacedName,
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSNonNullExpression,
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
// A type annotation that names a DOM type (`HTMLDivElement`) reads nothing at runtime; espree's references carry no flag and are all values.
const isValueReference = (reference: TSESLint.Scope.Reference) => reference.isValueReference !== false
const verdicts = new WeakMap<TSESTree.Program, boolean>()
const analyze = (sourceCode: Readonly<TSESLint.SourceCode>) => {
  const { classify, classifyTag, positionOf, variableOf, importedName } = createClassifier(
    sourceCode,
    false,
  )
  const isData = (node: TSESTree.Node) => classify(node, 'prop').data
  const isComponentBinding = (identifier: TSESTree.Identifier) => {
    const variable = variableOf(identifier, identifier.name)
    return (
      !!variable &&
      variable.defs.length > 0 &&
      variable.defs.every(
        (def) =>
          def.type === DefinitionType.Type ||
          (isComponentName(variable.name) &&
            (def.type === DefinitionType.FunctionName ||
              (def.type === DefinitionType.Variable && isComponentInit(def.node.init)))),
      )
    )
  }
  const isLocalRead = (node: TSESTree.MemberExpression) => {
    let root: TSESTree.Node = node
    while (root.type === AST_NODE_TYPES.MemberExpression) root = root.object
    const variable = root.type === AST_NODE_TYPES.Identifier ? variableOf(root, root.name) : null
    return !!variable?.defs.length && variable.defs.every((def) => def.type === DefinitionType.Variable)
  }
  const isInert = (node: TSESTree.Node): boolean => {
    if (FUNCTIONS.has(node.type)) return true
    if (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === 'delete') return false
    if (node.type === AST_NODE_TYPES.MemberExpression)
      return isLocalRead(node) && (!node.computed || isInert(node.property))
    if (node.type === AST_NODE_TYPES.CallExpression)
      return (
        (PURE_CALLS.has(calleeName(node.callee) ?? '') || isComponentWrapperCall(node)) &&
        node.arguments.every(isInert)
      )
    return INERT_TYPES.has(node.type) && childNodes(node, sourceCode.visitorKeys).every(isInert)
  }
  const exportsOnlyComponents = (declaration: TSESTree.NamedExportDeclarations) => {
    if (TYPE_DECLARATIONS.has(declaration.type)) return true
    if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
      return isComponentName(declaration.id?.name)
    if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return false
    return declaration.declarations.every(
      (declarator) =>
        declarator.id.type === AST_NODE_TYPES.Identifier &&
        isComponentName(declarator.id.name) &&
        declarator.init !== null &&
        isComponentInit(declarator.init) &&
        isInert(declarator.init),
    )
  }
  const isServerSafeStatement = (statement: TSESTree.ProgramStatement) => {
    switch (statement.type) {
      case AST_NODE_TYPES.ExpressionStatement:
        return statement.directive !== undefined
      case AST_NODE_TYPES.ImportDeclaration:
        if (statement.importKind === 'type') return true
        if (statement.specifiers.length === 0) return STYLESHEET.test(statement.source.value)
        return !CLIENT_MODULES.has(statement.source.value)
      case AST_NODE_TYPES.FunctionDeclaration:
      case AST_NODE_TYPES.TSEnumDeclaration:
        return true
      case AST_NODE_TYPES.VariableDeclaration:
        return statement.declarations.every(
          (declarator) => isInert(declarator.id) && (!declarator.init || isInert(declarator.init)),
        )
      case AST_NODE_TYPES.ExportAllDeclaration:
        return statement.exportKind === 'type'
      case AST_NODE_TYPES.ExportNamedDeclaration: {
        if (statement.exportKind === 'type') return true
        const isTypeOnly =
          statement.specifiers.length > 0 &&
          statement.specifiers.every((specifier) => specifier.exportKind === 'type')
        // A value re-exported from another module is how a boundary goes around a dependency that ships no directive.
        if (statement.source) return isTypeOnly
        if (statement.declaration) return exportsOnlyComponents(statement.declaration)
        return statement.specifiers.every(
          (specifier) =>
            specifier.exportKind === 'type' ||
            (specifier.local.type === AST_NODE_TYPES.Identifier && isComponentBinding(specifier.local)),
        )
      }
      case AST_NODE_TYPES.ExportDefaultDeclaration: {
        const { declaration } = statement
        if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
          return isComponentName(declaration.id?.name)
        if (declaration.type === AST_NODE_TYPES.Identifier) return isComponentBinding(declaration)
        return (
          isComponentWrapperCall(declaration) && isComponentInit(declaration) && isInert(declaration)
        )
      }
      default:
        return TYPE_DECLARATIONS.has(statement.type)
    }
  }
  // The name a call resolves to through an import alias (`import { useState as state }`), since React's client APIs are recognised by what they export.
  const clientCallName = (callee: TSESTree.Node) => {
    if (callee.type !== AST_NODE_TYPES.Identifier) return calleeName(callee)
    return importedName(variableOf(callee, callee.name)) || callee.name
  }
  const needsNode = (node: TSESTree.Node) => {
    switch (node.type) {
      case AST_NODE_TYPES.CallExpression: {
        const name = clientCallName(node.callee) ?? ''
        return HOOK.test(name) || CLIENT_CALLS.has(name)
      }
      case AST_NODE_TYPES.ClassDeclaration:
      case AST_NODE_TYPES.ClassExpression:
        return !!node.superClass && CLASS_BASES.has(calleeName(node.superClass) ?? '')
      case AST_NODE_TYPES.MemberExpression:
        return (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === 'globalThis' &&
          !node.computed &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          BROWSER_GLOBALS.has(node.property.name) &&
          !variableOf(node.object, 'globalThis')?.defs.length
        )
      case AST_NODE_TYPES.JSXOpeningElement: {
        if (!classifyTag(node).data) return true
        const isTag = positionOf(node) === 'text'
        return node.attributes.some((attribute) => {
          if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) return !isData(attribute.argument)
          const key = attribute.name.type === AST_NODE_TYPES.JSXIdentifier ? attribute.name.name : ''
          if (isEventHandler(key)) return true
          const { value } = attribute
          if (value?.type !== AST_NODE_TYPES.JSXExpressionContainer) return false
          return (isTag ? isFunctionAttribute(key) : key !== 'className') && !isData(value.expression)
        })
      }
      // A child of a component is its `children` prop, which can carry a function; a child of a tag or a fragment renders in place and cannot.
      case AST_NODE_TYPES.JSXExpressionContainer:
        return (
          node.parent.type === AST_NODE_TYPES.JSXElement &&
          positionOf(node.parent.openingElement) === 'prop' &&
          !isData(node.expression)
        )
      default:
        return false
    }
  }
  const walk = (node: TSESTree.Node): boolean =>
    needsNode(node) || childNodes(node, sourceCode.visitorKeys).some(walk)
  if (!sourceCode.ast.body.every(isServerSafeStatement) || walk(sourceCode.ast)) return true
  const scope = sourceCode.getScope(sourceCode.ast)
  return (
    scope.through.some(
      (reference) => isValueReference(reference) && BROWSER_GLOBALS.has(reference.identifier.name),
    ) ||
    scope.variables.some(
      (variable) =>
        variable.defs.length === 0 &&
        BROWSER_GLOBALS.has(variable.name) &&
        variable.references.some(isValueReference),
    )
  )
}
/** Whether a `'use client'` module needs the client, judged once per file by allow-list: it does unless every module-level statement, tag and value handed to a component is one a server module could hold. */
export const needsClient = (sourceCode: Readonly<TSESLint.SourceCode>) => {
  const cached = verdicts.get(sourceCode.ast)
  if (cached !== undefined) return cached
  const verdict = analyze(sourceCode)
  verdicts.set(sourceCode.ast, verdict)
  return verdict
}
