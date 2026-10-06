import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
const SKIPPED_KEYS = new Set(['typeAnnotation', 'typeArguments', 'typeParameters', 'returnType'])
const isNode = (value: unknown): value is TSESTree.Node =>
  typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
export const childNodes = (node: TSESTree.Node, visitorKeys: TSESLint.SourceCode.VisitorKeys) =>
  (visitorKeys[node.type] ?? [])
    .filter((key) => !SKIPPED_KEYS.has(key))
    .flatMap((key) => {
      const value: unknown = Reflect.get(node, key)
      return (Array.isArray(value) ? value : [value]).filter(isNode)
    })
