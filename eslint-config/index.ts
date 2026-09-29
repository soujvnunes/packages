import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import type { Linter } from 'eslint'
import prettier from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import betterTailwind from 'eslint-plugin-better-tailwindcss'
import importHelpers from 'eslint-plugin-import-helpers'
import importXPlugin from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import security from 'eslint-plugin-security'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { soujvnunesPlugin } from './plugin'
export { oneLineComments } from './oneLineComments'
export { soujvnunesPlugin } from './plugin'
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
const DEFAULT_IMPORT_GROUPS: (string | string[])[] = [
  '/^react/',
  '/^next/',
  'module',
  'parent',
  'sibling',
  'index',
]
const MAX_LINES = 300
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
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
  ],
  '@typescript-eslint/no-empty-interface': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-deprecated': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
}
const importRules: Linter.RulesRecord = {
  'import-x/no-default-export': 'error',
  'import-x/no-named-default': 'error',
  'import-x/no-named-as-default': 'error',
  'import-x/no-duplicates': 'error',
  'import-x/no-cycle': 'error',
  'import-x/no-self-import': 'error',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': 'off',
}
const securityRules: Linter.RulesRecord = {
  'security/detect-non-literal-regexp': 'error',
  'security/detect-unsafe-regex': 'error',
  'security/detect-eval-with-expression': 'error',
}
const generalRules: Linter.RulesRecord = {
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'no-debugger': 'error',
  'no-alert': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-template': 'error',
  'no-nested-ternary': 'error',
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
  'padding-line-between-statements': ['error', { blankLine: 'never', prev: '*', next: '*' }],
  'max-lines': ['error', { max: MAX_LINES, skipBlankLines: true, skipComments: true }],
}
type SelectorKey =
  | 'exportDefaultFunction'
  | 'exportNamedFunction'
  | 'tsEnum'
  | 'reactDefaultImport'
  | 'reactNamespaceImport'
  | 'reactTypeImportSpecifier'
  | 'reactTypeImportDeclaration'
  | 'lucideIcon'
  | 'nextFontGoogle'
  | 'cloneElementImport'
  | 'cloneElementMember'
const RESTRICTED_SELECTORS: Record<SelectorKey, { selector: string; message: string }> = {
  exportDefaultFunction: {
    selector: 'ExportDefaultDeclaration > FunctionDeclaration',
    message: 'Avoid `export default function`; use `export const` instead for tree-shakeable modules.',
  },
  exportNamedFunction: {
    selector: 'ExportNamedDeclaration > FunctionDeclaration',
    message: 'Use `export const` instead of `export function` for tree-shakeable modules.',
  },
  tsEnum: {
    selector: 'TSEnumDeclaration',
    message: 'Avoid enums; use const assertions or union types instead.',
  },
  reactDefaultImport: {
    selector: "ImportDeclaration[source.value='react'] > ImportDefaultSpecifier",
    message:
      'Do not import the React default. Use the ambient `React.*` namespace (the react-jsx runtime needs no React import).',
  },
  reactNamespaceImport: {
    selector: "ImportDeclaration[source.value='react'] > ImportNamespaceSpecifier",
    message: 'Do not `import * as React`. Use the ambient `React.*` namespace.',
  },
  reactTypeImportSpecifier: {
    selector: "ImportDeclaration[source.value='react'] > ImportSpecifier[importKind='type']",
    message:
      'Reference React types via the ambient `React.*` namespace, not a named `{ type X }` import from react.',
  },
  reactTypeImportDeclaration: {
    selector: "ImportDeclaration[importKind='type'][source.value='react']",
    message:
      'Reference React types via the ambient `React.*` namespace, not `import type … from "react"`.',
  },
  lucideIcon: {
    selector:
      "ImportDeclaration[source.value='lucide-react'][importKind!='type'] > ImportSpecifier[importKind!='type'][imported.name!=/Icon$/][imported.name!='createLucideIcon'][imported.name!='icons'][imported.name!='dynamicIconImports']",
    message: 'Import the `*Icon` name from lucide-react, so a rename never lands on the plain word.',
  },
  nextFontGoogle: {
    selector: "ImportDeclaration[source.value='next/font/google']",
    message: 'Self-host fonts instead of fetching them from next/font/google.',
  },
  cloneElementImport: {
    selector: "ImportDeclaration[source.value='react'] > ImportSpecifier[imported.name='cloneElement']",
    message: 'Avoid cloneElement; pass data through props instead of mutating a child element.',
  },
  cloneElementMember: {
    selector: "MemberExpression[object.name='React'][property.name='cloneElement']",
    message: 'Avoid React.cloneElement; pass data through props instead of mutating a child element.',
  },
}
const ALL_SELECTOR_KEYS = Object.keys(RESTRICTED_SELECTORS) as SelectorKey[]
const EXPORT_DEFAULT_KEYS: SelectorKey[] = ['exportDefaultFunction', 'exportNamedFunction']
const NON_EXPORT_DEFAULT_KEYS = ALL_SELECTOR_KEYS.filter((key) => !EXPORT_DEFAULT_KEYS.includes(key))
const cnTernarySelector = (classMergeName: string) => ({
  selector: `CallExpression[callee.name='${classMergeName}'] > ConditionalExpression`,
  message: 'Avoid a ternary inside `cn()`; use a cva variant or an object entry instead.',
})
const restrictedSyntaxRule = (
  keys: SelectorKey[],
  extra: { selector: string; message: string }[] = [],
): Linter.RulesRecord => ({
  'no-restricted-syntax': ['error', ...keys.map((key) => RESTRICTED_SELECTORS[key]), ...extra],
})
const reactRules: Linter.RulesRecord = {
  'react/prop-types': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/display-name': 'error',
  'react/jsx-no-target-blank': 'error',
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-key': 'error',
  'react/no-array-index-key': 'error',
  'react/no-children-prop': 'error',
  'react/no-danger': 'error',
  'react/no-deprecated': 'error',
  'react/no-direct-mutation-state': 'error',
  'react/no-unescaped-entities': 'error',
  'react/self-closing-comp': 'error',
  'react/jsx-boolean-value': ['error', 'never'],
  'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'error',
}
const nextRules: Linter.RulesRecord = {
  '@next/next/no-html-link-for-pages': 'error',
  '@next/next/no-img-element': 'error',
}
const JSX_A11Y_COMPONENTS: Record<string, string> = {
  Link: 'a',
  Image: 'img',
  Button: 'button',
  Input: 'input',
}
const importOrderRule = (groups: (string | string[])[]): Linter.RulesRecord => ({
  'import-helpers/order-imports': [
    'error',
    { newlinesBetween: 'never', groups, alphabetize: { order: 'asc', ignoreCase: true } },
  ],
})
const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const arbitraryTailwindValuePattern = (allow: string[]): string => {
  const exempt = allow.length ? `(?!(?:${allow.map(escapeForRegExp).join('|')})-)` : ''
  return `(?:^|:)${exempt}!?[a-zA-Z][a-zA-Z0-9-]*-\\[[^\\]]+\\](?:/[a-zA-Z0-9.]+)?!?$`
}
export interface ConfigOptions {
  /** Extra ignore globs, merged after the defaults. */
  ignores?: string[]
  /** Full import-order groups (replaces the default skeleton). */
  importGroups?: (string | string[])[]
  /** Root for typescript-eslint's project service. Defaults to cwd. */
  tsconfigRootDir?: string
  /** Path to the Tailwind v4 CSS entry (the file with `@import "tailwindcss"` + `@theme`, e.g. `./app/tailwind.config.css`). When set on the Next preset, it wires the bundled `eslint-plugin-better-tailwindcss` correctness rules, chiefly `no-unknown-classes`, which flags a class not registered in the theme (a dead token `tsc`/build cannot see; see DESIGN-TOKENS). Leave it unset and the plugin stays off, since without the entry the rule cannot resolve the theme and would flag every class. */
  tailwindEntryPoint?: string
  /** Utility prefixes exempt from the arbitrary-Tailwind-value ban, for a shape with no theme token (e.g. `['grid-cols', 'grid-rows']` for `grid-cols-[200px_1fr]`). Only read when `tailwindEntryPoint` is set. */
  allowArbitraryClasses?: string[]
  /** The `cn()`-like helper name a ternary passed straight to it is banned inside of. */
  classMergeName?: string
  /** Modules next.config.* loads, beside next.config.* itself, restricted with the same repo's `no-restricted-imports` patterns (`['@/*']`) as the config file: relative imports only. */
  nextConfigModules?: string[]
  /** Globs wired to `soujvnunes/one-export-per-file`, the probe-only one-value-export-per-module rule. Unwired (no globs) leaves the rule exported but off. */
  strictExportGlobs?: string[]
  /** Extra flat-config objects appended at the end. */
  extend?: Linter.Config[]
}
const buildConfig = ({
  next = false,
  ignores = [],
  importGroups = DEFAULT_IMPORT_GROUPS,
  tsconfigRootDir = process.cwd(),
  tailwindEntryPoint,
  allowArbitraryClasses = [],
  classMergeName = 'cn',
  nextConfigModules = [],
  strictExportGlobs = [],
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
    ...restrictedSyntaxRule(ALL_SELECTOR_KEYS, next ? [cnTernarySelector(classMergeName)] : []),
    ...importOrderRule(importGroups),
  }
  const languageGlobals: Record<string, unknown> = { ...globals.node, ...globals.es2021 }
  const settings: Record<string, unknown> = {}
  if (next) {
    Object.assign(plugins, {
      '@next/next': nextPlugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    })
    Object.assign(rules, reactRules, nextRules, jsxA11y.configs.recommended.rules)
    Object.assign(languageGlobals, globals.browser, {
      React: 'readonly',
      JSX: 'readonly',
      NodeJS: 'readonly',
    })
    settings.react = { version: 'detect' }
    settings['import-x/resolver-next'] = [createTypeScriptImportResolver({ alwaysTryTypes: true })]
    settings['jsx-a11y'] = { components: JSX_A11Y_COMPONENTS }
    if (tailwindEntryPoint) {
      plugins['better-tailwindcss'] = betterTailwind
      Object.assign(rules, {
        'better-tailwindcss/no-unknown-classes': 'error',
        'better-tailwindcss/no-conflicting-classes': 'error',
        'better-tailwindcss/no-concatenated-classes': 'error',
        'better-tailwindcss/no-restricted-classes': [
          'error',
          {
            restrict: [
              {
                pattern: arbitraryTailwindValuePattern(allowArbitraryClasses),
                message:
                  'Avoid an arbitrary Tailwind value ($0); use a theme token, or list its prefix in allowArbitraryClasses when it has none (e.g. grid-cols-[...]).',
              },
            ],
          },
        ],
      })
      settings['better-tailwindcss'] = { entryPoint: tailwindEntryPoint }
    }
  }
  const rootConfigOverride: Linter.Config = {
    files: ['*.{mjs,js,ts,mts,cts}'],
    rules: {
      'import-x/no-default-export': 'off',
      ...restrictedSyntaxRule(NON_EXPORT_DEFAULT_KEYS, next ? [cnTernarySelector(classMergeName)] : []),
    },
  }
  const nextFileConventionsOverride: Linter.Config = {
    files: [
      '**/{default,page,layout,error,loading,forbidden,not-found,template,unauthorized,icon,apple-icon,manifest,opengraph-image,twitter-image,global-error,proxy,middleware,sitemap,robots}.{ts,tsx}',
    ],
    rules: {
      'import-x/no-default-export': 'off',
      ...restrictedSyntaxRule(NON_EXPORT_DEFAULT_KEYS, [cnTernarySelector(classMergeName)]),
    },
  }
  const commentsOverride: Linter.Config = {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    plugins: { soujvnunes: soujvnunesPlugin },
    rules: { 'soujvnunes/one-line-comments': 'error', 'soujvnunes/no-comments': 'error' },
  }
  const clientBoundaryOverride: Linter.Config = {
    files: ['**/*.{jsx,tsx}'],
    ignores: ['**/{error,global-error}.{jsx,tsx}'],
    plugins: { soujvnunes: soujvnunesPlugin },
    rules: {
      'soujvnunes/no-needless-use-client': 'error',
      'soujvnunes/no-static-jsx-in-client': 'error',
    },
  }
  const programBanRule = (message: string): Linter.RulesRecord =>
    restrictedSyntaxRule(ALL_SELECTOR_KEYS, [
      cnTernarySelector(classMergeName),
      { selector: 'Program', message },
    ])
  const barrelOverride: Linter.Config = {
    files: ['**/index.{ts,tsx}'],
    ignores: ['**/pages/**'],
    rules: programBanRule('Avoid a barrel index file; import each module by its own path.'),
  }
  const featureRootOverride: Linter.Config = {
    files: ['**/features/*/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: programBanRule('A feature root holds only subfolders; place this file inside one of them.'),
  }
  const scriptsOverride: Linter.Config = {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  }
  const maxLinesExemptOverride: Linter.Config = {
    files: ['**/*.test.*', '**/copy/**'],
    rules: { 'max-lines': 'off' },
  }
  const pureUtilsOverride: Linter.Config = {
    files: ['**/utils/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['server-only', 'next/*', 'react', '@/lib/*', '@/app/*'] },
      ],
    },
  }
  const nextConfigModulesOverride: Linter.Config = {
    files: ['next.config.{js,mjs,ts,mts,cts}', ...nextConfigModules],
    rules: { 'no-restricted-imports': ['error', { patterns: ['@/*'] }] },
  }
  const strictExportsOverride: Linter.Config = {
    files: strictExportGlobs,
    plugins: { soujvnunes: soujvnunesPlugin },
    rules: { 'soujvnunes/one-export-per-file': 'error' },
  }
  return [
    { ignores: [...DEFAULT_IGNORES, ...ignores] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      plugins,
      linterOptions: { reportUnusedDisableDirectives: 'error' },
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
    commentsOverride,
    rootConfigOverride,
    ...(next
      ? [nextFileConventionsOverride, clientBoundaryOverride, barrelOverride, featureRootOverride]
      : []),
    maxLinesExemptOverride,
    pureUtilsOverride,
    scriptsOverride,
    ...(next && nextConfigModules.length ? [nextConfigModulesOverride] : []),
    ...(strictExportGlobs.length ? [strictExportsOverride] : []),
    ...extend,
  ]
}
/** Base config for TypeScript libraries (no React/Next layers). */
export const createBaseConfig = (options?: ConfigOptions) => buildConfig({ ...options, next: false })
/** Full config for Next.js apps: base plus React, React Hooks, jsx-a11y and Next plugins. */
export const createNextConfig = (options?: ConfigOptions) => buildConfig({ ...options, next: true })
