import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils'
import { BROWSER_GLOBALS } from './browserGlobals'
import { calleeName } from './calleeName'
import { childNodes } from './childNodes'
import type { createClassifier } from './createClassifier'
import { importedName } from './importedName'
import { isEventHandler } from './isEventHandler'
import { isFunctionAttribute } from './isFunctionAttribute'
const HOOK = /^use[A-Z]/u
const CLIENT_CALLS = new Set(['use', 'createContext', 'createPortal', 'flushSync'])
const CLASS_BASES = new Set(['Component', 'PureComponent'])
export const createClientWalk = (
  sourceCode: Readonly<TSESLint.SourceCode>,
  { classify, classifyTag, positionOf, variableOf }: ReturnType<typeof createClassifier>,
  countsOnlyInlineFunctions = false,
) => {
  const isData = (node: TSESTree.Node) => classify(node, 'prop').data
  const isClientValue = (node: TSESTree.Node) =>
    countsOnlyInlineFunctions
      ? node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.FunctionExpression
      : !isData(node)
  const callNames = (callee: TSESTree.Node) => {
    if (callee.type !== AST_NODE_TYPES.Identifier) return [calleeName(callee)]
    return [callee.name, importedName(variableOf(callee, callee.name))]
  }
  const needsNode = (node: TSESTree.Node) => {
    switch (node.type) {
      case AST_NODE_TYPES.CallExpression:
        return callNames(node.callee).some((name) => HOOK.test(name) || CLIENT_CALLS.has(name))
      case AST_NODE_TYPES.ClassDeclaration:
      case AST_NODE_TYPES.ClassExpression:
        return !!node.superClass && CLASS_BASES.has(calleeName(node.superClass))
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
          if (isTag) return isFunctionAttribute(key) && !isData(value.expression)
          return key !== 'className' && isClientValue(value.expression)
        })
      }
      case AST_NODE_TYPES.JSXExpressionContainer:
        return (
          node.parent.type === AST_NODE_TYPES.JSXElement &&
          positionOf(node.parent.openingElement) === 'prop' &&
          isClientValue(node.expression)
        )
      default:
        return false
    }
  }
  const walk = (node: TSESTree.Node): boolean =>
    needsNode(node) || childNodes(node, sourceCode.visitorKeys).some(walk)
  return walk
}
