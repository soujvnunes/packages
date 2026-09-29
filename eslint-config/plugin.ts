import { needlessUseClient } from './needlessUseClient'
import { noComments } from './noComments'
import { oneExportPerFile } from './oneExportPerFile'
import { oneLineComments } from './oneLineComments'
import { staticJsxInClient } from './staticJsxInClient'
type CompatiblePlugin = { meta: { name: string } }
const plugin = {
  meta: { name: '@soujvnunes/eslint-config' },
  rules: {
    'one-line-comments': oneLineComments,
    'no-comments': noComments,
    'no-needless-use-client': needlessUseClient,
    'no-static-jsx-in-client': staticJsxInClient,
    'one-export-per-file': oneExportPerFile,
  },
}
export const soujvnunesPlugin: CompatiblePlugin = plugin
