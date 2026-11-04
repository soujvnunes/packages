import { AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils'
import { BROWSER_GLOBALS } from './browserGlobals'
import { calleeName } from './calleeName'
import { childNodes } from './childNodes'
import { createClassifier } from './createClassifier'
import { createClientWalk } from './createClientWalk'
import { everyDef } from './everyDef'
import { isComponentInit } from './isComponentInit'
import { isComponentName } from './isComponentName'
import { isComponentWrapperCall } from './isComponentWrapperCall'
import { isFunctionNode } from './isFunctionNode'
const { DefinitionType } = TSESLint.Scope
const STYLESHEET = /\.(?:css|scss|sass|less)$/u
const CLIENT_MODULES = new Set(['next/dynamic', 'client-only'])
const PURE_CALLS = new Set(['cva', 'tv'])
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
const isValueReference = (reference: TSESLint.Scope.Reference) => reference.isValueReference !== false
const verdicts = new WeakMap<TSESTree.Program, boolean>()
const analyze = (sourceCode: Readonly<TSESLint.SourceCode>) => {
  const classifier = createClassifier(sourceCode, false)
  const { variableOf } = classifier
  const walk = createClientWalk(sourceCode, classifier)
  const isComponentBinding = (identifier: TSESTree.Identifier) => {
    const variable = variableOf(identifier, identifier.name)
    const isNamedLikeComponent = isComponentName(variable?.name)
    return everyDef(
      variable,

      (def) =>
        def.type === DefinitionType.Type ||
        (isNamedLikeComponent &&
          (def.type === DefinitionType.FunctionName ||
            (def.type === DefinitionType.Variable && isComponentInit(def.node.init)))),
    )
  }
  const isLocalRead = (node: TSESTree.MemberExpression) => {
    let root: TSESTree.Node = node
    while (root.type === AST_NODE_TYPES.MemberExpression) {
      if (root.computed && !isInert(root.property)) return false
      root = root.object
    }
    const variable = root.type === AST_NODE_TYPES.Identifier ? variableOf(root, root.name) : null
    return everyDef(variable, (def) => def.type === DefinitionType.Variable)
  }
  const isPlainCallee = (callee: TSESTree.Node): boolean =>
    callee.type === AST_NODE_TYPES.Identifier ||
    (callee.type === AST_NODE_TYPES.MemberExpression &&
      !callee.computed &&
      isPlainCallee(callee.object))
  const isInert = (node: TSESTree.Node): boolean => {
    if (isFunctionNode(node)) return true
    if (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === 'delete') return false
    if (node.type === AST_NODE_TYPES.MemberExpression) return isLocalRead(node)
    if (node.type === AST_NODE_TYPES.CallExpression)
      return (
        isPlainCallee(node.callee) &&
        (PURE_CALLS.has(calleeName(node.callee)) || isComponentWrapperCall(node)) &&
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
        return true
      case AST_NODE_TYPES.TSEnumDeclaration:
        return statement.body.members.every(
          (member) => !member.initializer || isInert(member.initializer),
        )
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
export const needsClient = (sourceCode: Readonly<TSESLint.SourceCode>) => {
  const cached = verdicts.get(sourceCode.ast)
  if (cached !== undefined) return cached
  const verdict = analyze(sourceCode)
  verdicts.set(sourceCode.ast, verdict)
  return verdict
}
