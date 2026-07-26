// Dogfood: this monorepo formats itself with its own config.
// No Tailwind here, so the plugin + its options are stripped.
import { createConfig } from '@soujvnunes/prettier-config'

const { tailwindStylesheet, tailwindFunctions, ...config } = createConfig()

export default { ...config, plugins: [] }
