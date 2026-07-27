import { createRequire } from 'node:module'

import type { Config } from 'stylelint'

const require = createRequire(import.meta.url)

// Base — `stylelint-config-standard` plus this house's deviations. Resolve the shared config to an
// absolute path from THIS package (where it's a bundled dependency), so consumers load it regardless
// of their package manager's hoisting — pnpm keeps it out of the app root, and stylelint would
// otherwise resolve the bare `extends` string against the consumer and fail.
const base: Config = {
  extends: [require.resolve('stylelint-config-standard')],
  rules: {
    // Tailwind v4 at-rules aren't in stylelint's known list — allow them instead of erroring.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'plugin',
          'import',
          'theme',
          'source',
          'utility',
          'variant',
          'custom-variant',
        ],
      },
    ],
    'import-notation': 'string',
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'shorthand-property-no-redundant-values': true,
    'color-function-notation': 'modern',
    'alpha-value-notation': 'percentage',
    'font-family-name-quotes': 'always-where-recommended',
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,
    'custom-property-pattern': null,
  },
}

/**
 * Shared Stylelint config. Pass any Stylelint option to override the base; `rules` merge onto the
 * base rules while other keys replace. The common override is `ignoreFiles` (e.g. a Tailwind theme
 * file whose generated custom properties trip the standard rules).
 */
export const createConfig = (overrides: Config = {}): Config => ({
  ...base,
  ...overrides,
  rules: { ...base.rules, ...overrides.rules },
})
