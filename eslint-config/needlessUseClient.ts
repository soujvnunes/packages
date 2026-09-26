import { ESLintUtils } from '@typescript-eslint/utils'
import { createClientNeedTracker } from './createClientNeedTracker'
import { findUseClientDirective } from './findUseClientDirective'
export const needlessUseClient = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow a `'use client'` directive in a module that holds only what a server module could: server-safe module-level statements, component exports, renderable tags and data handed to components.",
    },
    schema: [],
    messages: {
      needless:
        "Nothing in this file needs `'use client'`: no hook call, no event handler, no browser global, no class component, no `next/dynamic` or `client-only`, nothing run at module level, no export but components, no tag a server component could not render, and every value it hands to a component is data a server parent could pass. A file without the directive still runs on the client when a client component imports it, so delete the line and let the importer decide. If a dependency without its own directive needs a boundary here, re-export it from this file, or disable this rule on the line with the reason.",
    },
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context
    const directive = findUseClientDirective(sourceCode.ast)
    if (!directive) return {}
    const tracker = createClientNeedTracker(sourceCode)
    return {
      ...tracker.listeners,
      'Program:exit'() {
        if (!tracker.needsClient()) context.report({ node: directive, messageId: 'needless' })
      },
    }
  },
})
