import type { Linter } from 'eslint'
import globals from 'globals'
import tseslint from 'typescript-eslint'
export const ruleSetups: [string, Linter.LanguageOptions][] = [
  ['espree with no globals', {}],
  [
    "the Next preset's TypeScript parser and browser globals",
    { parser: tseslint.parser, globals: globals.browser, parserOptions: { lib: ['dom', 'esnext'] } },
  ],
]
