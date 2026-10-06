import { createRequire } from 'node:module'
import type { Config } from 'stylelint'
const require = createRequire(import.meta.url)
const base: Config = {
  extends: [require.resolve('stylelint-config-standard')],
  rules: {
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
export const createConfig = (overrides: Config = {}): Config => ({
  ...base,
  ...overrides,
  rules: { ...base.rules, ...overrides.rules },
})
