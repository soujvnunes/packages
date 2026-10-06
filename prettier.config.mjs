import { createConfig } from '@soujvnunes/prettier-config'

const { tailwindStylesheet, tailwindFunctions, ...config } = createConfig()

export default { ...config, plugins: [] }
