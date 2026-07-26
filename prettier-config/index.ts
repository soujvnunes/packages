import type { Config } from 'prettier'

// Base — only Prettier's own options, so the `Config` type is the enforced source of truth.
const base: Config = {
  jsxSingleQuote: false,
  bracketSameLine: true,
  singleAttributePerLine: true,
  singleQuote: true,
  semi: false,
  trailingComma: 'all',
  printWidth: 104,
  bracketSpacing: true,
}

// Plugin-contributed options (prettier-plugin-tailwindcss) — not part of Prettier's Config type.
const tailwind = {
  tailwindStylesheet: './app/tailwind.config.css',
  tailwindFunctions: ['cva', 'twMerge', 'cn'],
  plugins: ['prettier-plugin-tailwindcss'],
}

/**
 * Shared Prettier config. Pass any Prettier option to override the base; the common one is
 * `tailwindStylesheet` (its path differs between `app/` and `src/app/` layouts).
 */
export const createConfig = (overrides: Config = {}): Config => ({
  ...base,
  ...tailwind,
  ...overrides,
})
