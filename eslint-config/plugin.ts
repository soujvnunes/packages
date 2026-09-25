import { needlessUseClient } from './needlessUseClient'
import { oneLineComments } from './oneLineComments'
import { staticJsxInClient } from './staticJsxInClient'
// The shape typescript-eslint publishes its own plugin under: ESLint's plugin type rejects the RuleContext of a typescript-eslint rule, and this upcast to the fields every consumer reads needs no assertion.
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
