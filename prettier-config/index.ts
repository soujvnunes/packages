import { createRequire } from 'node:module'
import type { Config } from 'prettier'
const require = createRequire(import.meta.url)
const base: Config = {
  jsxSingleQuote: false,
  bracketSameLine: true,
  singleAttributePerLine: false,
  singleQuote: true,
  semi: false,
  trailingComma: 'all',
  printWidth: 104,
  bracketSpacing: true,
  objectWrap: 'collapse',
  proseWrap: 'never',
}
const tailwind = {
  tailwindStylesheet: './app/tailwind.config.css',
  tailwindFunctions: ['cva', 'twMerge', 'cn'],
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
}
export const createConfig = (overrides: Config = {}): Config => ({ ...base, ...tailwind, ...overrides })
