import { AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils'
import globals from 'globals'
import { calleeName } from './calleeName'
import { createClassifier } from './createClassifier'
import { isComponentInit } from './isComponentInit'
import { isFunctionAttribute } from './isFunctionAttribute'
const { DefinitionType } = TSESLint.Scope
const HOOK = /^use[A-Z]/u
const HANDLER = /^on[A-Z]/u
const COMPONENT = /^[A-Z]/u
const STYLESHEET = /\.(?:css|scss|sass|less)$/u
const CLIENT_CALLS = new Set(['use', 'createContext'])
const CLIENT_MODULES = new Set(['next/dynamic', 'client-only'])
const CLASS_BASES = new Set(['Component', 'PureComponent'])
// Calls known to return a value and do nothing else, so running one at module level is as safe on the server as a literal.
const PURE_CALLS = new Set(['cva', 'tv', 'memo', 'forwardRef'])
const TYPE_DECLARATIONS = new Set<string>([
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.TSDeclareFunction,
  AST_NODE_TYPES.TSEnumDeclaration,
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
/** Tracks whether a `'use client'` module needs the client, by allow-list: it does unless every module-level statement, tag and value handed to a component is one a server module could hold. */
export const createClientNeedTracker = (sourceCode: Readonly<TSESLint.SourceCode>) => {
  const { classify, classifyTag, positionOf, variableOf } = createClassifier(sourceCode, false)
  const isData = (node: TSESTree.Node) => classify(node, 'prop').data
  let needed = false
  const need = () => {
    needed = true
  }
  const isComponentName = (name: string | undefined) => !!name && COMPONENT.test(name)
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
  // Evaluated on import, so on the server for every server importer: a value is inert when building it runs nothing and reads no import's members.
  const isInert = (node: TSESTree.Node): boolean => {
    switch (node.type) {
      case AST_NODE_TYPES.Literal:
      case AST_NODE_TYPES.Identifier:
      case AST_NODE_TYPES.ArrowFunctionExpression:
      case AST_NODE_TYPES.FunctionExpression:
      case AST_NODE_TYPES.JSXElement:
      case AST_NODE_TYPES.JSXFragment:
        return true
      case AST_NODE_TYPES.TemplateLiteral:
        return node.expressions.every(isInert)
      case AST_NODE_TYPES.UnaryExpression:
        return isInert(node.argument)
      case AST_NODE_TYPES.BinaryExpression:
      case AST_NODE_TYPES.LogicalExpression:
        return isInert(node.left) && isInert(node.right)
      case AST_NODE_TYPES.ConditionalExpression:
        return isInert(node.test) && isInert(node.consequent) && isInert(node.alternate)
      case AST_NODE_TYPES.ArrayExpression:
        return node.elements.every(
          (element) =>
            !element ||
            isInert(element.type === AST_NODE_TYPES.SpreadElement ? element.argument : element),
        )
      case AST_NODE_TYPES.ObjectExpression:
        return node.properties.every((property) =>
          property.type === AST_NODE_TYPES.SpreadElement
            ? isInert(property.argument)
            : isInert(property.value) && (!property.computed || isInert(property.key)),
        )
      case AST_NODE_TYPES.MemberExpression: {
        let root: TSESTree.Node = node
        while (root.type === AST_NODE_TYPES.MemberExpression) root = root.object
        const variable = root.type === AST_NODE_TYPES.Identifier ? variableOf(root, root.name) : null
        return (
          !!variable?.defs.length &&
          variable.defs.every((def) => def.type === DefinitionType.Variable) &&
          (!node.computed || isInert(node.property))
        )
      }
      case AST_NODE_TYPES.CallExpression:
        return PURE_CALLS.has(calleeName(node.callee) ?? '') && node.arguments.every(isInert)
      case AST_NODE_TYPES.TSAsExpression:
      case AST_NODE_TYPES.TSSatisfiesExpression:
      case AST_NODE_TYPES.TSNonNullExpression:
        return isInert(node.expression)
      default:
        return false
    }
  }
  const exportsOnlyComponents = (declaration: TSESTree.NamedExportDeclarations) => {
    if (TYPE_DECLARATIONS.has(declaration.type))
      return declaration.type !== AST_NODE_TYPES.TSEnumDeclaration
    if (declaration.type === AST_NODE_TYPES.FunctionDeclaration)
      return isComponentName(declaration.id?.name)
    if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return false
    return declaration.declarations.every(
      (declarator) =>
        declarator.id.type === AST_NODE_TYPES.Identifier &&
        isComponentName(declarator.id.name) &&
        isComponentInit(declarator.init),
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
        return true
      case AST_NODE_TYPES.VariableDeclaration:
        return statement.declarations.every(
          (declarator) => !declarator.init || isInert(declarator.init),
        )
      case AST_NODE_TYPES.ExportAllDeclaration:
        return statement.exportKind === 'type'
      case AST_NODE_TYPES.ExportNamedDeclaration: {
        if (statement.exportKind === 'type') return true
        const typeOnly = statement.specifiers.every((specifier) => specifier.exportKind === 'type')
        // A value re-exported from another module is how a boundary goes around a dependency that ships no directive.
        if (statement.source) return typeOnly
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
        return declaration.type === AST_NODE_TYPES.CallExpression && isComponentInit(declaration)
      }
      default:
        return TYPE_DECLARATIONS.has(statement.type)
    }
  }
  const listeners: TSESLint.RuleListener = {
    Program(program) {
      if (!program.body.every(isServerSafeStatement)) need()
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
      if (needed) return
      if (!classifyTag(node).data) need()
      const isTag = positionOf(node) === 'text'
      for (const attribute of node.attributes) {
        if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) {
          if (!isData(attribute.argument)) need()
          continue
        }
        const key = attribute.name.type === AST_NODE_TYPES.JSXIdentifier ? attribute.name.name : ''
        const { value } = attribute
        if (HANDLER.test(key)) need()
        else if (
          (isTag ? isFunctionAttribute(key) : key !== 'className') &&
          value?.type === AST_NODE_TYPES.JSXExpressionContainer &&
          !isData(value.expression)
        )
          need()
      }
    },
    JSXExpressionContainer(node) {
      if (needed || node.parent.type !== AST_NODE_TYPES.JSXElement) return
      if (positionOf(node.parent.openingElement) === 'prop' && !isData(node.expression)) need()
    },
  }
  const needsClient = () => {
    if (needed) return true
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
  return { listeners, needsClient }
}
