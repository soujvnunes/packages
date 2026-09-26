import { needlessUseClient } from './needlessUseClient'
import { oneLineComments } from './oneLineComments'
import { staticJsxInClient } from './staticJsxInClient'
// The shape typescript-eslint publishes its own plugin under, an upcast with no assertion: ESLint's plugin type rejects the RuleContext of a typescript-eslint rule, so `rules` is there at runtime for ESLint to read and absent from the type.
type CompatiblePlugin = { meta: { name: string } }
const plugin = {
  // No `version`: it feeds ESLint's cache key, and a hardcoded one drifts from package.json and serves stale cached results after a behaviour change.
  meta: { name: '@soujvnunes/eslint-config' },
  rules: {
    'one-line-comments': oneLineComments,
    'no-needless-use-client': needlessUseClient,
    'no-static-jsx-in-client': staticJsxInClient,
  },
}
export const soujvnunesPlugin: CompatiblePlugin = plugin
