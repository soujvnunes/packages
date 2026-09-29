import { Linter } from 'eslint'
import { soujvnunesPlugin } from './plugin'
/** Lints one snippet, named `component.tsx` unless `filename` says otherwise, with one of this package's rules through the plugin, the way a consumer's flat config runs it. */
export const lintWithRule = (
  languageOptions: Linter.LanguageOptions,
  code: string,
  rule: Linter.RulesRecord,
  filename = 'component.tsx',
): Linter.LintMessage[] =>
  new Linter().verify(
    code,
    {
      files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
      plugins: { soujvnunes: soujvnunesPlugin },
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ...languageOptions,
        parserOptions: { ecmaFeatures: { jsx: true }, ...languageOptions.parserOptions },
      },
      linterOptions: { reportUnusedDisableDirectives: 'off' },
      rules: rule,
    },
    filename,
  )
