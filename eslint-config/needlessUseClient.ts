import type { Rule, Scope } from 'eslint'
import { useClientDirective } from './useClientDirective'
// ESLint types the estree core only, so the JSX shapes this rule reads are declared here, as narrow as the reads.
type Named = { type: string; name?: string; property?: Named }
type Expression = Named & { init?: Named | null }
type JsxAttribute = { name: Named; value: { type: string; expression?: Expression } | null }
type JsxContainer = { expression: Expression; parent: { type: string } }
type Call = { callee: Named }
type ClassNode = { superClass?: Named | null }
type ImportNode = { source: { value: unknown }; specifiers: { type: string; local: Named }[] }
const HOOK = /^use[A-Z]/u
const HANDLER = /^on[A-Z]/u
const CLIENT_CALLS = new Set(['use', 'createContext'])
const CLASS_BASES = new Set(['Component', 'PureComponent'])
const FUNCTIONS = new Set(['ArrowFunctionExpression', 'FunctionExpression'])
// Globals that exist only in a browser, so reading one at render or in an effect is a real reason for the directive.
const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'matchMedia',
  'requestAnimationFrame',
  'IntersectionObserver',
  'ResizeObserver',
  'MutationObserver',
]
const calleeName = (callee: Named) =>
  callee.type === 'MemberExpression' ? callee.property?.name : callee.name
const isClientCall = (name: string | undefined) => !!name && (HOOK.test(name) || CLIENT_CALLS.has(name))
// A function declared in this module and handed to JSX, which a server component could never pass across the boundary.
const isLocalFunction = (variable: Scope.Variable | null | undefined) =>
  !!variable?.defs.some(
    (def) =>
      def.type === 'FunctionName' ||
      (def.type === 'Variable' && FUNCTIONS.has((def.node as Expression).init?.type ?? '')),
  )
const readsBrowserGlobal = (scope: Scope.Scope) =>
  BROWSER_GLOBALS.some((name) => !!scope.set.get(name)?.references.length) ||
  scope.through.some((reference) => BROWSER_GLOBALS.includes(reference.identifier.name))
export const needlessUseClient: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow a `'use client'` directive in a module with nothing that needs the client: no hook, no event handler, no function handed to JSX, no browser global, no class component.",
    },
    schema: [],
    messages: {
      needless:
        "Nothing in this file needs `'use client'`: no hook call, no event handler, no function handed to JSX, no browser global, no class component, no `next/dynamic`. A file without the directive still runs on the client when a client component imports it, so delete the line and let the importer decide. If a dependency without its own directive needs a boundary here, re-export it from this file, or disable this rule on the line with the reason.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const directive = useClientDirective(sourceCode)
    if (!directive) return {}
    const dynamicNames = new Set<string>()
    let needed = false
    const need = () => {
      needed = true
    }
    const handsFunction = (node: Rule.Node, expression: Expression | undefined) => {
      if (!expression) return false
      if (FUNCTIONS.has(expression.type)) return true
      if (expression.type !== 'Identifier') return false
      const reference = sourceCode
        .getScope(node)
        .references.find((candidate) => (candidate.identifier as unknown) === expression)
      return isLocalFunction(reference?.resolved)
    }
    return {
      ImportDeclaration(node) {
        const declaration = node as unknown as ImportNode
        if (declaration.source.value !== 'next/dynamic') return
        for (const specifier of declaration.specifiers)
          if (specifier.type === 'ImportDefaultSpecifier' && specifier.local.name)
            dynamicNames.add(specifier.local.name)
      },
      CallExpression(node) {
        const name = calleeName((node as unknown as Call).callee)
        if (isClientCall(name) || (!!name && dynamicNames.has(name))) need()
      },
      'ClassDeclaration, ClassExpression'(node: Rule.Node) {
        const base = (node as unknown as ClassNode).superClass
        if (base && CLASS_BASES.has(calleeName(base) ?? '')) need()
      },
      JSXAttribute(node: Rule.Node) {
        const attribute = node as unknown as JsxAttribute
        if (HANDLER.test(attribute.name.name ?? '')) need()
        else if (handsFunction(node, attribute.value?.expression)) need()
      },
      JSXExpressionContainer(node: Rule.Node) {
        const container = node as unknown as JsxContainer
        if (container.parent.type === 'JSXElement' && handsFunction(node, container.expression)) need()
      },
      'ExportAllDeclaration, ExportNamedDeclaration[source]': need,
      'Program:exit'(node) {
        if (needed || readsBrowserGlobal(sourceCode.getScope(node))) return
        context.report({ node: directive, messageId: 'needless' })
      },
    }
  },
}
