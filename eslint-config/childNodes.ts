import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
// Type positions are erased before anything runs, so they hold nothing to judge.
const SKIPPED_KEYS = new Set(['typeAnnotation', 'typeArguments', 'typeParameters', 'returnType'])
const isNode = (value: unknown): value is TSESTree.Node =>
  typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
/** A node's child nodes, by the parser's visitor keys, type annotations left out. */
export const childNodes = (node: TSESTree.Node, visitorKeys: TSESLint.SourceCode.VisitorKeys) =>
  (visitorKeys[node.type] ?? [])
    .filter((key) => !SKIPPED_KEYS.has(key))
    .flatMap((key) => {
      const value: unknown = Reflect.get(node, key)
      return (Array.isArray(value) ? value : [value]).filter(isNode)
    })
