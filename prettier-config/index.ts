import { createRequire } from 'node:module'

import type { Config } from 'prettier'

const require = createRequire(import.meta.url)

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
  // Collapse any object literal onto one line when it fits — smaller files, less to read.
  objectWrap: 'collapse',
}

// Plugin-contributed options (prettier-plugin-tailwindcss) — not part of Prettier's Config type.
const tailwind = {
  tailwindStylesheet: './app/tailwind.config.css',
  tailwindFunctions: ['cva', 'twMerge', 'cn'],
  // Resolve to an absolute path from THIS package (where the plugin is a bundled dependency), so
  // consumers load it regardless of their package manager's hoisting — pnpm keeps it out of the app
  // root, and prettier would otherwise resolve the bare string against the consumer and fail.
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
}

/**
 * Shared Prettier config. Pass any Prettier option to override the base; the common one is
 * `tailwindStylesheet` (its path differs between `app/` and `src/app/` layouts).
 */
export const createConfig = (overrides: Config = {}): Config => ({ ...base, ...tailwind, ...overrides })
