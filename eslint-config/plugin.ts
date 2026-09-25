import { needlessUseClient } from './needlessUseClient'
import { oneLineComments } from './oneLineComments'
import { staticJsxInClient } from './staticJsxInClient'
export const soujvnunesPlugin = {
  // No `version`: it feeds ESLint's cache key, and a hardcoded one drifts from package.json and serves stale cached results after a behaviour change.
  meta: { name: '@soujvnunes/eslint-config' },
  rules: {
    'one-line-comments': oneLineComments,
    'no-needless-use-client': needlessUseClient,
    'no-static-jsx-in-client': staticJsxInClient,
  },
}
