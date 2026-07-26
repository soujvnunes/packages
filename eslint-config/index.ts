import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import type { Linter } from 'eslint'
import prettier from 'eslint-config-prettier'
import importHelpers from 'eslint-plugin-import-helpers'
import importXPlugin from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import security from 'eslint-plugin-security'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const DEFAULT_IGNORES: string[] = [
  '**/node_modules/**',
  '**/.next/**',
  '**/out/**',
  '**/build/**',
  '**/dist/**',
  '*.config.js',
  '*.config.mjs',
  'next-env.d.ts',
]

// Generic skeleton — no project paths. Consumers pass their own `@/…` groups between
// `module` and `parent` via the `importGroups` option.
const DEFAULT_IMPORT_GROUPS: (string | string[])[] = [
  '/^react/',
  '/^next/',
  'module',
  'parent',
  'sibling',
  'index',
]

const typescriptRules: Linter.RulesRecord = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      args: 'all',
      caughtErrors: 'all',
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      ignoreRestSiblings: false,
      caughtErrorsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
  ],
  '@typescript-eslint/no-empty-interface': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': 'error',
}

const importRules: Linter.RulesRecord = {
  'import-x/no-default-export': 'error',
  'import-x/no-named-default': 'error',
  'import-x/no-named-as-default': 'error',
  'import-x/no-duplicates': 'error',
  'import-x/no-cycle': 'error',
  'import-x/no-self-import': 'error',
  'import-x/newline-after-import': 'error',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': 'off',
}

const securityRules: Linter.RulesRecord = {
  'security/detect-object-injection': 'warn',
  'security/detect-non-literal-regexp': 'warn',
  'security/detect-unsafe-regex': 'error',
  'security/detect-eval-with-expression': 'error',
}

const generalRules: Linter.RulesRecord = {
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-debugger': 'error',
  'no-alert': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-template': 'error',
  'no-nested-ternary': 'warn',
  'no-unneeded-ternary': 'error',
  'no-param-reassign': ['error', { props: false }],
  'no-return-await': 'error',
  'no-throw-literal': 'error',
  'no-unused-expressions': 'error',
  'no-useless-concat': 'error',
  'no-useless-return': 'error',
  'no-void': 'error',
  'prefer-promise-reject-errors': 'error',
  'require-await': 'error',
  yoda: 'error',
  eqeqeq: ['error', 'always'],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-script-url': 'error',
  'lines-around-comment': [
    'error',
    {
      beforeBlockComment: true,
      afterBlockComment: false,
      beforeLineComment: true,
      afterLineComment: false,
      allowBlockStart: true,
      allowBlockEnd: false,
      allowObjectStart: true,
      allowArrayStart: true,
    },
  ],
  'newline-before-return': 'error',
  'padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: '*', next: 'if' },
    { blankLine: 'always', prev: 'if', next: '*' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
    { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
    { blankLine: 'always', prev: 'directive', next: '*' },
    { blankLine: 'any', prev: 'directive', next: 'directive' },
    { blankLine: 'always', prev: 'import', next: '*' },
    { blankLine: 'any', prev: 'import', next: 'import' },
    { blankLine: 'always', prev: '*', next: 'export' },
    { blankLine: 'always', prev: 'export', next: '*' },
    { blankLine: 'any', prev: 'export', next: 'export' },
    { blankLine: 'always', prev: ['function', 'class'], next: '*' },
    { blankLine: 'always', prev: '*', next: ['function', 'class'] },
    { blankLine: 'always', prev: 'switch', next: '*' },
    { blankLine: 'always', prev: '*', next: 'switch' },
    { blankLine: 'always', prev: 'try', next: '*' },
    { blankLine: 'always', prev: '*', next: 'try' },
    { blankLine: 'always', prev: 'while', next: '*' },
    { blankLine: 'always', prev: '*', next: 'while' },
    { blankLine: 'always', prev: 'for', next: '*' },
    { blankLine: 'always', prev: '*', next: 'for' },
  ],
}

const restrictedSyntaxRule: Linter.RulesRecord = {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ExportDefaultDeclaration > FunctionDeclaration',
      message:
        'Avoid `export default function`; use `export const` instead for tree-shakeable modules.',
    },
    {
      selector: 'ExportNamedDeclaration > FunctionDeclaration',
      message: 'Use `export const` instead of `export function` for tree-shakeable modules.',
    },
    {
      selector: 'TSEnumDeclaration',
      message: 'Avoid enums; use const assertions or union types instead.',
    },
    {
      selector: "ImportDeclaration[source.value='react'] > ImportDefaultSpecifier",
      message:
        'Do not import the React default — use the ambient `React.*` namespace (the react-jsx runtime needs no React import).',
    },
    {
      selector: "ImportDeclaration[source.value='react'] > ImportNamespaceSpecifier",
      message: 'Do not `import * as React` — use the ambient `React.*` namespace.',
    },
    {
      selector: "ImportDeclaration[source.value='react'] > ImportSpecifier[importKind='type']",
      message:
        'Reference React types via the ambient `React.*` namespace, not a named `{ type X }` import from react.',
    },
    {
      selector: "ImportDeclaration[importKind='type'][source.value='react']",
      message:
        'Reference React types via the ambient `React.*` namespace, not `import type … from "react"`.',
    },
  ],
}

const reactRules: Linter.RulesRecord = {
  'react/prop-types': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/display-name': 'warn',
  'react/jsx-no-target-blank': 'error',
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-key': 'error',
  'react/no-array-index-key': 'warn',
  'react/no-children-prop': 'error',
  'react/no-danger': 'warn',
  'react/no-deprecated': 'error',
  'react/no-direct-mutation-state': 'error',
  'react/no-unescaped-entities': 'error',
  'react/self-closing-comp': 'error',
  'react/jsx-boolean-value': ['error', 'never'],
  'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
}

const nextRules: Linter.RulesRecord = {
  '@next/next/no-html-link-for-pages': 'error',
  '@next/next/no-img-element': 'error',
}

const importOrderRule = (groups: (string | string[])[]): Linter.RulesRecord => ({
  'import-helpers/order-imports': [
    'warn',
    { newlinesBetween: 'always', groups, alphabetize: { order: 'asc', ignoreCase: true } },
  ],
})

export interface ConfigOptions {
  /** Extra ignore globs, merged after the defaults. */
  ignores?: string[]
  /** Full import-order groups (replaces the default skeleton). */
  importGroups?: (string | string[])[]
  /** Root for typescript-eslint's project service. Defaults to cwd. */
  tsconfigRootDir?: string
  /** Extra flat-config objects appended at the end. */
  extend?: Linter.Config[]
}

const buildConfig = ({
  next = false,
  ignores = [],
  importGroups = DEFAULT_IMPORT_GROUPS,
  tsconfigRootDir = process.cwd(),
  extend = [],
}: ConfigOptions & { next?: boolean } = {}) => {
  const plugins: Record<string, unknown> = {
    'import-x': importXPlugin,
    'import-helpers': importHelpers,
    'unused-imports': unusedImports,
    security,
  }
  const rules: Linter.RulesRecord = {
    ...typescriptRules,
    ...importRules,
    ...securityRules,
    ...generalRules,
    ...restrictedSyntaxRule,
    ...importOrderRule(importGroups),
  }
  const languageGlobals: Record<string, unknown> = { ...globals.node, ...globals.es2021 }
  // Default to import-x's built-in node resolver (pure JS, no native binary to build in
  // consumers). Projects needing `@/…` alias resolution add a TS resolver via `extend`.
  const settings: Record<string, unknown> = {}

  if (next) {
    Object.assign(plugins, {
      '@next/next': nextPlugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    })
    Object.assign(rules, reactRules, nextRules)
    Object.assign(languageGlobals, globals.browser, {
      React: 'readonly',
      JSX: 'readonly',
      NodeJS: 'readonly',
    })
    settings.react = { version: 'detect' }
  }

  // Root config files + scripts legitimately default-export — always exempt (a base TS lib
  // has e.g. `vitest.config.ts` / `tsup.config.ts`, which aren't in DEFAULT_IGNORES).
  const rootConfigOverride: Linter.Config = {
    files: ['*.{mjs,js,ts,mts,cts}'],
    rules: { 'import-x/no-default-export': 'off', 'no-restricted-syntax': 'off' },
  }
  // Next.js framework file conventions (page, layout, error, …) must default-export — next only.
  const nextFileConventionsOverride: Linter.Config = {
    files: [
      '**/{default,page,layout,error,loading,forbidden,not-found,template,unauthorized,icon,apple-icon,manifest,opengraph-image,twitter-image,global-error,middleware,sitemap,robots}.{ts,tsx}',
    ],
    rules: { 'import-x/no-default-export': 'off', 'no-restricted-syntax': 'off' },
  }
  // Node scripts own stdout — printing IS their job.
  const scriptsOverride: Linter.Config = {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  }

  return [
    { ignores: [...DEFAULT_IGNORES, ...ignores] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      plugins,
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
          projectService: true,
          tsconfigRootDir,
        },
        globals: languageGlobals,
      },
      settings,
      rules,
    },
    prettier,
    rootConfigOverride,
    ...(next ? [nextFileConventionsOverride] : []),
    scriptsOverride,
    ...extend,
  ]
}

/** Base config for TypeScript libraries (no React/Next layers). */
export const createBaseConfig = (options?: ConfigOptions) => buildConfig({ ...options, next: false })

/** Full config for Next.js apps — base plus React, React Hooks, jsx-a11y and Next plugins. */
export const createNextConfig = (options?: ConfigOptions) => buildConfig({ ...options, next: true })
