import type { Linter } from 'eslint'
import globals from 'globals'
import tseslint from 'typescript-eslint'
/** The two settings every client-boundary case runs under: bare, and what the Next preset gives a `.tsx` file, since a declared global or a TypeScript lib global resolves differently from an undeclared one. */
export const ruleSetups: [string, Linter.LanguageOptions][] = [
  ['espree with no globals', {}],
  [
    "the Next preset's TypeScript parser and browser globals",
    { parser: tseslint.parser, globals: globals.browser, parserOptions: { lib: ['dom', 'esnext'] } },
  ],
]
