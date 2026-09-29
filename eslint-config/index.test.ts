import { ESLint, Linter } from 'eslint'
import type { Linter as LinterTypes } from 'eslint'
import { describe, expect, it } from 'vitest'
import { lintWithRule } from './lintWithRule'
import { soujvnunesPlugin } from './plugin'
import { createBaseConfig, createNextConfig, type ConfigOptions } from './index'
const TAILWIND_ENTRY = './app/tailwind.config.css'
const mainBlock = (config: LinterTypes.Config[]) => {
  const block = config.find((entry) => entry.files?.[0] === '**/*.{js,jsx,ts,tsx}')
  if (!block) throw new Error('The main config block is missing from the flat config.')
  return block
}
const importGroups = (config: LinterTypes.Config[]) => {
  const rule = mainBlock(config).rules?.['import-helpers/order-imports'] as [
    string,
    { groups: string[] },
  ]
  return rule[1].groups
}
describe('shared shape', () => {
  it.each([
    ['base', createBaseConfig],
    ['next', createNextConfig],
  ])('%s returns a flat config array that opens with the ignores', (_name, create) => {
    const config = create()
    expect(Array.isArray(config)).toBe(true)
    expect(config[0].ignores).toEqual(expect.arrayContaining(['**/node_modules/**', '**/dist/**']))
  })
  it.each([
    ['base', createBaseConfig],
    ['next', createNextConfig],
  ])('%s merges extra ignores after the defaults', (_name, create) => {
    const config = create({ ignores: ['generated/**'] })
    expect(config[0].ignores).toEqual(expect.arrayContaining(['**/node_modules/**', 'generated/**']))
  })
  it.each([
    ['base', createBaseConfig],
    ['next', createNextConfig],
  ])('%s appends the extend blocks at the very end', (_name, create) => {
    const extra: LinterTypes.Config = { files: ['custom/**'], rules: { 'no-var': 'off' } }
    const config = create({ extend: [extra] })
    expect(config.at(-1)).toBe(extra)
  })
  it.each([
    ['base', createBaseConfig],
    ['next', createNextConfig],
  ])('%s uses the project service rather than a parserOptions.project path', (_name, create) => {
    const parserOptions = mainBlock(create()).languageOptions?.parserOptions
    expect(parserOptions).toMatchObject({ projectService: true, tsconfigRootDir: process.cwd() })
    expect(parserOptions).not.toHaveProperty('project')
  })
  it('takes a tsconfigRootDir override', () => {
    const config = createBaseConfig({ tsconfigRootDir: '/repo' })
    expect(mainBlock(config).languageOptions?.parserOptions).toMatchObject({ tsconfigRootDir: '/repo' })
  })
  it('exempts root config files from the default-export ban, keeping the syntax bans that are not about export shape', () => {
    const override = createBaseConfig().find((entry) => entry.files?.[0] === '*.{mjs,js,ts,mts,cts}')
    expect(override?.rules?.['import-x/no-default-export']).toBe('off')
    const rule = override?.rules?.['no-restricted-syntax'] as [string, ...{ selector: string }[]]
    const selectors = rule.slice(1).map((entry) => (entry as { selector: string }).selector)
    expect(selectors).not.toEqual(
      expect.arrayContaining(['ExportDefaultDeclaration > FunctionDeclaration']),
    )
    expect(selectors).toEqual(expect.arrayContaining(['TSEnumDeclaration']))
  })
})
describe('import order', () => {
  it('defaults to the generic skeleton, with no project paths', () => {
    expect(importGroups(createBaseConfig())).toEqual([
      '/^react/',
      '/^next/',
      'module',
      'parent',
      'sibling',
      'index',
    ])
  })
  it('replaces the skeleton with the groups passed in', () => {
    const groups = ['/^react/', 'module', '/@/shared/', 'parent', 'sibling', 'index']
    expect(importGroups(createBaseConfig({ importGroups: groups }))).toEqual(groups)
  })
})
describe('createBaseConfig', () => {
  it('bundles the plugin set a TypeScript library needs', () => {
    expect(Object.keys(mainBlock(createBaseConfig()).plugins ?? {}).sort()).toEqual([
      'import-helpers',
      'import-x',
      'security',
      'unused-imports',
    ])
  })
  it('leaves out the React, Next and a11y layers', () => {
    const plugins = mainBlock(createBaseConfig()).plugins ?? {}
    expect(plugins).not.toHaveProperty('react')
    expect(plugins).not.toHaveProperty('@next/next')
    expect(plugins).not.toHaveProperty('jsx-a11y')
  })
  it('stays on the built-in resolver, so a library needs no resolver wiring', () => {
    expect(mainBlock(createBaseConfig()).settings).toEqual({})
  })
  it('skips the Next file-convention exemption, which only applies to an app', () => {
    const override = createBaseConfig().find((entry) =>
      entry.files?.[0]?.includes('{default,page,layout'),
    )
    expect(override).toBeUndefined()
  })
  it('leaves out the client-boundary rules, since a plain TypeScript library has no client modules', () => {
    const rules = createBaseConfig().flatMap((entry) => Object.keys(entry.rules ?? {}))
    expect(rules).not.toContain('soujvnunes/no-needless-use-client')
    expect(rules).not.toContain('soujvnunes/no-static-jsx-in-client')
  })
})
describe('createNextConfig', () => {
  it('adds the React, Next and a11y plugins on top of the base set', () => {
    expect(Object.keys(mainBlock(createNextConfig()).plugins ?? {}).sort()).toEqual([
      '@next/next',
      'import-helpers',
      'import-x',
      'jsx-a11y',
      'react',
      'react-hooks',
      'security',
      'unused-imports',
    ])
  })
  it('wires the TypeScript import resolver, so a consumer resolves @/... with no install', () => {
    const settings = mainBlock(createNextConfig()).settings ?? {}
    expect(settings.react).toEqual({ version: 'detect' })
    expect(settings['import-x/resolver-next']).toHaveLength(1)
  })
  it('exempts the Next file conventions from the default-export ban only, so page.tsx still gets the lucide selector', () => {
    const override = createNextConfig().find((entry) =>
      entry.files?.[0]?.includes('{default,page,layout'),
    )
    expect(override?.rules?.['import-x/no-default-export']).toBe('off')
    const rule = override?.rules?.['no-restricted-syntax'] as [
      string,
      ...{ selector: string; message: string }[],
    ]
    const selectors = rule.slice(1).map((entry) => (entry as { selector: string }).selector)
    expect(selectors).not.toEqual(
      expect.arrayContaining(['ExportDefaultDeclaration > FunctionDeclaration']),
    )
    expect(selectors).not.toEqual(
      expect.arrayContaining(['ExportNamedDeclaration > FunctionDeclaration']),
    )
    expect(selectors).toEqual(
      expect.arrayContaining([
        "ImportDeclaration[source.value='lucide-react'][importKind!='type'] > ImportSpecifier[importKind!='type'][imported.name!=/Icon$/][imported.name!='createLucideIcon'][imported.name!='icons'][imported.name!='dynamicIconImports']",
      ]),
    )
  })
  it.each(['proxy', 'middleware'])('exempts %s, since a repo can be on either name', (name) => {
    const override = createNextConfig().find((entry) =>
      entry.files?.[0]?.includes('{default,page,layout'),
    )
    expect(override?.files?.[0]).toContain(`,${name},`)
  })
  it('turns on both client-boundary rules at error, on JSX files only', () => {
    const block = createNextConfig().find((entry) => entry.rules?.['soujvnunes/no-needless-use-client'])
    expect(block?.rules).toEqual({
      'soujvnunes/no-needless-use-client': 'error',
      'soujvnunes/no-static-jsx-in-client': 'error',
    })
    expect(block?.files).toEqual(['**/*.{jsx,tsx}'])
    expect(block?.ignores).toEqual(['**/{error,global-error}.{jsx,tsx}'])
    expect(block?.plugins?.soujvnunes).toBe(soujvnunesPlugin)
  })
  it('bans the React default and namespace imports in favour of the ambient namespace', () => {
    const rule = mainBlock(createNextConfig()).rules?.['no-restricted-syntax'] as [
      string,
      ...{ selector: string }[],
    ]
    const selectors = rule.slice(1).map((entry) => (entry as { selector: string }).selector)
    expect(selectors).toEqual(
      expect.arrayContaining([
        "ImportDeclaration[source.value='react'] > ImportDefaultSpecifier",
        "ImportDeclaration[source.value='react'] > ImportNamespaceSpecifier",
      ]),
    )
  })
})
describe('tailwindEntryPoint', () => {
  it('leaves the plugin off when unset, since the rule cannot resolve a theme it has no entry for', () => {
    const config = createNextConfig()
    expect(mainBlock(config).plugins).not.toHaveProperty('better-tailwindcss')
    expect(mainBlock(config).rules).not.toHaveProperty('better-tailwindcss/no-unknown-classes')
    expect(mainBlock(config).settings).not.toHaveProperty('better-tailwindcss')
  })
  it('wires the correctness rules and the entry point when set on the Next preset', () => {
    const config = createNextConfig({ tailwindEntryPoint: TAILWIND_ENTRY })
    expect(mainBlock(config).plugins).toHaveProperty('better-tailwindcss')
    expect(mainBlock(config).rules).toMatchObject({
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-concatenated-classes': 'error',
    })
    expect(mainBlock(config).settings?.['better-tailwindcss']).toEqual({ entryPoint: TAILWIND_ENTRY })
  })
  it('leaves the stylistic rules to prettier-plugin-tailwindcss, which already owns class order', () => {
    const rules = mainBlock(createNextConfig({ tailwindEntryPoint: TAILWIND_ENTRY })).rules ?? {}
    expect(rules).not.toHaveProperty('better-tailwindcss/enforce-consistent-class-order')
  })
  it('does nothing on the base preset, which has no Tailwind layer to wire it into', () => {
    const options: ConfigOptions = { tailwindEntryPoint: TAILWIND_ENTRY }
    expect(mainBlock(createBaseConfig(options)).plugins).not.toHaveProperty('better-tailwindcss')
  })
})
describe('one-line-comments', () => {
  const jsx = { parserOptions: { ecmaFeatures: { jsx: true } } }
  type Options = LinterTypes.LanguageOptions | undefined
  type Invalid = {
    code: string
    output: string | null
    errors: { messageId: string }[]
    languageOptions?: LinterTypes.LanguageOptions
  }
  const RULE: LinterTypes.RulesRecord = { 'soujvnunes/one-line-comments': 'error' }
  const verify = (code: string, languageOptions: Options) =>
    lintWithRule(languageOptions ?? {}, code, RULE, 'a.js').filter(
      ({ fatal, ruleId }) => fatal ?? ruleId === 'soujvnunes/one-line-comments',
    )
  const fixOnce = (code: string, languageOptions: Options) => {
    let output = ''
    let cursor = 0
    for (const { fix: edit } of verify(code, languageOptions)) {
      if (!edit || edit.range[0] < cursor) continue
      output += code.slice(cursor, edit.range[0]) + edit.text
      cursor = edit.range[1]
    }
    return output + code.slice(cursor)
  }
  const run = (tests: {
    valid: (string | { code: string; languageOptions: LinterTypes.LanguageOptions })[]
    invalid: Invalid[]
  }) => {
    for (const test of tests.valid) {
      const { code, languageOptions } = typeof test === 'string' ? { code: test } : test
      expect(verify(code, languageOptions), code).toEqual([])
    }
    for (const { code, output, errors, languageOptions } of tests.invalid) {
      const messageIds = verify(code, languageOptions).map(({ fatal, message, messageId }) => ({
        messageId: fatal ? message : messageId,
      }))
      expect(messageIds, code).toEqual(errors)
      expect(fixOnce(code, languageOptions), code).toBe(output ?? code)
    }
  }
  const fix = (code: string) =>
    new Linter().verifyAndFix(code, {
      plugins: { soujvnunes: soujvnunesPlugin },
      rules: { 'soujvnunes/one-line-comments': 'error' },
    }).output
  it('passes its own suite of valid and invalid cases', () => {
    run({
      valid: [
        '// One line, however long it runs, which is the whole point and stays legal at any length.',
        'const a = 1\n// A comment separated from another by code.\nconst b = 2\n// Another one.',
        '/** Single-line JSDoc above the symbol it documents. */\nconst a = 1',
        '// A module preamble, which is a different comment from the JSDoc under it.\n/** Doc for a. */\nconst a = 1',
        'const f = (/** the id */ id) => id',
        '/** Doc. */\n// eslint-disable-next-line no-console\nconsole.log(1)',
        '/** @jsx h */\n/** @jsxFrag Fragment */\nconst a = 1',
        '/** @typedef {number} Id */\n/** @typedef {string} Name */\nexport const a = 1',
        'export const a = 1\n/** @typedef {number} Id */',
        'const a = 1 // trailing\nconst b = 2 // trailing on the next line',
        'const a = 1 // trailing\n// own-line under a trailing one',
        'const a = `\n// not a comment, it is template text\n// neither is this\n`',
        '// eslint-disable-next-line no-console\n// prose under a directive is exempt, joining would bury it\nconsole.log(1)',
        '// @ts-expect-error the types are wrong here\n// eslint-disable-next-line no-console\nconsole.log(1)',
        '// @ts-check\n// prose under the pragma, which only counts when it stands alone\nconst a = 1',
        '// prettier-ignore\n// prose under prettier-ignore, which tolerates no trailing text\nconst m = [1, 2]',
        '/// <amd-module name="x" />\n// prose under a triple-slash directive\nconst a = 1',
        '// end of the bundle\n//# sourceMappingURL=a.js.map',
        '/* eslint-disable no-console */\nconsole.log(1)',
        '/* global window */\nwindow.a = 1',
        '/* @jsx h */\n/* @jsxFrag Fragment */\nconst a = 1',
        '/* @jest-environment jsdom */\nconst a = 1',
        '/* node:coverage disable */\nconst a = 1\n/* node:coverage enable */',
        'const a = /* @__NOINLINE__ */ f()',
        '/*# sourceMappingURL=a.js.map */',
        '/*! Preserved banner, which has no line form. */\nconst a = 1',
        "const key = 'x' /* test key, gitleaks:allow */",
        '#!/usr/bin/env node\n// the interpreter line is not a comment line\nconst a = 1',
        {
          code: 'const a = (\n  <p /* on the tag */ id="x">\n    {/* one */}\n    text\n    {/** two */}\n  </p>\n)',
          languageOptions: jsx,
        },
      ],
      invalid: [
        {
          code: '// First line.\n// Second line.\nconst a = 1',
          output: '// First line. Second line.\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: 'const a = (\n  <p>{\n    // a\n    // b\n  }</p>\n)',
          output: 'const a = (\n  <p>{\n    // a b\n  }</p>\n)',
          errors: [{ messageId: 'adjacent' }],
          languageOptions: jsx,
        },
        {
          code: '// One.\n// Two.\n// Three.\nconst a = 1',
          output: '// One. Two. Three.\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '// global state lives here\n// and it is shared, which is prose and not the block-only directive\nconst a = 1',
          output:
            '// global state lives here and it is shared, which is prose and not the block-only directive\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '//\n// A stray bare line above, which separates nothing.\nconst a = 1',
          output: '// A stray bare line above, which separates nothing.\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '// A stray bare line below, which separates nothing.\n//\nconst a = 1',
          output: '// A stray bare line below, which separates nothing.\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '// First paragraph.\n//\n// Second paragraph.\nconst a = 1',
          output: null,
          errors: [{ messageId: 'paragraphs' }],
        },
        {
          code: '/*\n * Long rationale here\n * mention gitleaks:allow\n */\nconst a = 1',
          output: '// Long rationale here mention gitleaks:allow\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '// Long rationale here\n// mention gitleaks:allow\nconst a = 1',
          output: '// Long rationale here mention gitleaks:allow\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '/**\n * Shared Prettier config.\n */\nconst a = 1',
          output: '/** Shared Prettier config. */\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/**\n * Old.\n * @deprecated use next\n */\nexport const a = 1',
          output: '/** Old. @deprecated use next */\nexport const a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/**\n * Does a thing.\n *\n * @param a the id\n * @returns the thing\n */\nexport const f = (a) => a',
          output: '/** Does a thing. @param a the id @returns the thing */\nexport const f = (a) => a',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/**\n * First paragraph.\n *\n * Second paragraph.\n */\nconst a = 1',
          output: null,
          errors: [{ messageId: 'paragraphs' }],
        },
        {
          code: '/*!\n * MIT License\n *\n * (c) 2026 Someone\n */\nconst a = 1',
          output: '/*! MIT License (c) 2026 Someone */\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: 'const a = (\n  <p>\n    {/* one\n\n      two */}\n  </p>\n)',
          output: 'const a = (\n  <p>\n    {/* one two */}\n  </p>\n)',
          languageOptions: jsx,
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/*\n  First paragraph.\n\n  Second paragraph.\n*/\nconst a = 1',
          output: null,
          errors: [{ messageId: 'paragraphs' }],
        },
        {
          code: '/**\n *\n * One paragraph with stray empty lines at both edges.\n *\n */\nconst a = 1',
          output: '/** One paragraph with stray empty lines at both edges. */\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/*!\n * Banner\n * (c) 2026\n */\nconst a = 1',
          output: '/*! Banner (c) 2026 */\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/*\n  Plain block.\n*/\nconst a = 1',
          output: '// Plain block.\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/*\n  **bold** start, and *.test.ts keeps its star\n*/\nconst a = 1',
          output: '// **bold** start, and *.test.ts keeps its star\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/*\n * @ts-ignore is what we avoid here, and flattening must not make it live\n */\nconst a = 1',
          output: null,
          errors: [{ messageId: 'block' }],
        },
        {
          code: 'foo() /* one\n  two */\nbar()',
          output: 'foo() // one two\nbar()',
          errors: [{ messageId: 'block' }],
        },
        { code: '/* one\n  two */ foo()', output: null, errors: [{ messageId: 'block' }] },
        {
          code: 'function f() {\n  return /* one\n  two */ 42\n}',
          output: null,
          errors: [{ messageId: 'block' }],
        },
        {
          code: 'const a = (\n  <p>\n    {/* one\n      two */}\n  </p>\n)',
          output: 'const a = (\n  <p>\n    {/* one two */}\n  </p>\n)',
          languageOptions: jsx,
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/* Plain block. */\nconst a = 1',
          output: '// Plain block.\nconst a = 1',
          errors: [{ messageId: 'notDoc' }],
        },
        {
          code: 'const a = 1 /* trailing */\nconst b = 2',
          output: 'const a = 1 // trailing\nconst b = 2',
          errors: [{ messageId: 'notDoc' }],
        },
        { code: 'const a = /* inline */ 1', output: null, errors: [{ messageId: 'notDoc' }] },
        {
          code: '// a\n/* */\n// b\nconst a = 1',
          output: null,
          errors: [{ messageId: 'adjacent' }, { messageId: 'notDoc' }],
        },
        {
          code: '/** Orphan doc. */\n// note\nconst a = 1',
          output: null,
          errors: [{ messageId: 'orphanDoc' }, { messageId: 'adjacent' }],
        },
        {
          code: '/** Doc. */\n/** More doc, which belongs in the first one. */\nconst a = 1',
          output: null,
          errors: [{ messageId: 'orphanDoc' }],
        },
        {
          code: 'const a = (\n  <p>\n    {/* one */}\n    {/* two */}\n  </p>\n)',
          output: null,
          languageOptions: jsx,
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: 'const a = (\n  <p>\n    {/** one */}\n    {/** two */}\n  </p>\n)',
          output: null,
          languageOptions: jsx,
          errors: [{ messageId: 'adjacent' }],
        },
      ],
    })
  })
  it('rewrites a plain block as a line comment, then joins it with its neighbour on the next pass', () => {
    expect(fix('// one\n/* two */\nconst a = 1')).toBe('// one two\nconst a = 1')
  })
})
describe('comment rules', () => {
  it.each([
    ['base', createBaseConfig],
    ['next', createNextConfig],
  ])(
    '%s turns on one-line-comments and no-comments at error, on a glob that reaches .mjs and .cjs',
    (_name, create) => {
      const block = create().find((entry) => entry.rules?.['soujvnunes/no-comments'])
      expect(block?.rules).toEqual({
        'soujvnunes/one-line-comments': 'error',
        'soujvnunes/no-comments': 'error',
      })
      expect(block?.plugins?.soujvnunes).toBe(soujvnunesPlugin)
      expect(block?.files).toEqual(['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'])
    },
  )
  it("reports the JSDoc on an export too under jsdoc: 'never'", () => {
    const lintDoc = (options: LinterTypes.RuleEntry) =>
      new Linter()
        .verify('/** Doc. */\nexport const a = 1', {
          plugins: { soujvnunes: soujvnunesPlugin },
          rules: { 'soujvnunes/no-comments': options },
        })
        .map(({ messageId }) => messageId)
    expect(lintDoc('error')).toEqual([])
    expect(lintDoc(['error', { jsdoc: 'never' }])).toEqual(['jsdoc'])
  })
})
const mainRestrictedSyntaxSelectors = (config: LinterTypes.Config[]) => {
  const rule = mainBlock(config).rules?.['no-restricted-syntax'] as [string, ...{ selector: string }[]]
  return rule.slice(1).map((entry) => (entry as { selector: string }).selector)
}
describe('a11y', () => {
  it('turns on the jsx-a11y recommended rules at error on the Next preset', () => {
    const rules = mainBlock(createNextConfig()).rules ?? {}
    expect(rules['jsx-a11y/alt-text']).toBe('error')
    expect(rules['jsx-a11y/anchor-has-content']).toBe('error')
  })
  it('leaves jsx-a11y out of the base preset entirely', () => {
    const rules = mainBlock(createBaseConfig()).rules ?? {}
    expect(Object.keys(rules).some((rule) => rule.startsWith('jsx-a11y/'))).toBe(false)
  })
  it('maps Link, Image, Button and Input to the native element they render, on the Next preset', () => {
    const settings = mainBlock(createNextConfig()).settings ?? {}
    expect(settings['jsx-a11y']).toEqual({
      components: { Link: 'a', Image: 'img', Button: 'button', Input: 'input' },
    })
  })
})
describe('new restricted-syntax selectors', () => {
  it('bans a lucide-react import whose name does not end in Icon, on both presets', () => {
    expect(mainRestrictedSyntaxSelectors(createBaseConfig())).toEqual(
      expect.arrayContaining([expect.stringContaining("source.value='lucide-react'")]),
    )
  })
  it('bans an import from next/font/google', () => {
    expect(mainRestrictedSyntaxSelectors(createNextConfig())).toEqual(
      expect.arrayContaining(["ImportDeclaration[source.value='next/font/google']"]),
    )
  })
  it('bans cloneElement as a named react import and as React.cloneElement', () => {
    const selectors = mainRestrictedSyntaxSelectors(createNextConfig())
    expect(selectors).toEqual(
      expect.arrayContaining([
        "ImportDeclaration[source.value='react'] > ImportSpecifier[imported.name='cloneElement']",
        "MemberExpression[object.name='React'][property.name='cloneElement']",
      ]),
    )
  })
  it('exempts the createLucideIcon, icons and dynamicIconImports names', () => {
    const selector = mainRestrictedSyntaxSelectors(createBaseConfig()).find((entry) =>
      entry.includes("source.value='lucide-react'"),
    )
    const rule: LinterTypes.RuleEntry = ['error', { selector, message: 'x' }]
    const lint = (code: string) => lintWithRule({}, code, { 'no-restricted-syntax': rule })
    expect(lint("import { createLucideIcon, icons, dynamicIconImports } from 'lucide-react'")).toEqual(
      [],
    )
    expect(lint("import { Home } from 'lucide-react'")).toHaveLength(1)
  })
})
describe('barrel and feature-root files', () => {
  it('reports every index.ts/tsx barrel file outside pages/', () => {
    const override = createNextConfig().find(
      (entry) => Array.isArray(entry.files) && entry.files[0] === '**/index.{ts,tsx}',
    )
    expect(override?.ignores).toEqual(['**/pages/**'])
  })
  it('reports a loose file at a feature root, exempting its own tests and the Next file conventions', () => {
    const override = createNextConfig().find(
      (entry) => Array.isArray(entry.files) && entry.files[0] === '**/features/*/*.{ts,tsx}',
    )
    expect(override?.ignores).toEqual([
      '**/*.test.{ts,tsx}',
      expect.stringContaining('{default,page,layout'),
    ])
  })
  it('lets a route file under a features segment keep export default function, since a page cannot leave its segment', async () => {
    const eslint = new ESLint({
      cwd: process.cwd(),
      overrideConfigFile: true,
      overrideConfig: createNextConfig(),
    })
    const selectorsFor = async (path: string) => {
      const config = (await eslint.calculateConfigForFile(path)) as LinterTypes.Config
      const rule = config.rules?.['no-restricted-syntax'] as [unknown, ...{ selector: string }[]]
      return rule.slice(1).map((entry) => (entry as { selector: string }).selector)
    }
    const page = await selectorsFor('app/features/[slug]/page.tsx')
    expect(page).not.toContain('Program')
    expect(page).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining('ExportDefaultDeclaration > FunctionDeclaration'),
      ]),
    )
    expect(await selectorsFor('app/features/[slug]/helpers.ts')).toContain('Program')
  })
  it.each(['**/index.{ts,tsx}', '**/features/*/*.{ts,tsx}'])(
    'keeps every main-block syntax ban in %s, since an override replaces the whole no-restricted-syntax entry',
    (glob) => {
      const config = createNextConfig({ classMergeName: 'clsx' })
      const override = config.find((entry) => Array.isArray(entry.files) && entry.files[0] === glob)
      const rule = override?.rules?.['no-restricted-syntax'] as [string, ...{ selector: string }[]]
      const selectors = rule.slice(1).map((entry) => (entry as { selector: string }).selector)
      expect(selectors).toEqual([...mainRestrictedSyntaxSelectors(config), 'Program'])
    },
  )
  it('leaves both overrides off the base preset, whose index.ts is an npm entry point, not a barrel', () => {
    const config = createBaseConfig()
    expect(
      config.some((entry) => Array.isArray(entry.files) && entry.files[0] === '**/index.{ts,tsx}'),
    ).toBe(false)
  })
})
describe('cn() ternary', () => {
  it("bans a ternary passed straight to cn() on the Next preset's main block", () => {
    expect(mainRestrictedSyntaxSelectors(createNextConfig())).toEqual(
      expect.arrayContaining(["CallExpression[callee.name='cn'] > ConditionalExpression"]),
    )
  })
  it('reads the callee name from classMergeName', () => {
    expect(mainRestrictedSyntaxSelectors(createNextConfig({ classMergeName: 'clsx' }))).toEqual(
      expect.arrayContaining(["CallExpression[callee.name='clsx'] > ConditionalExpression"]),
    )
  })
  it('is absent on the base preset, which has no Tailwind layer to merge classes for', () => {
    expect(mainRestrictedSyntaxSelectors(createBaseConfig())).not.toEqual(
      expect.arrayContaining([expect.stringContaining("callee.name='cn'")]),
    )
  })
  it('still reaches page.tsx and next.config.ts, the two overrides the file-convention composition could have dropped it from', () => {
    const page = createNextConfig().find((entry) => entry.files?.[0]?.includes('{default,page,layout'))
    const root = createNextConfig().find((entry) => entry.files?.[0] === '*.{mjs,js,ts,mts,cts}')
    const selectorsOf = (entry?: LinterTypes.Config) =>
      ((entry?.rules?.['no-restricted-syntax'] as [string, ...{ selector: string }[]]) ?? []).map(
        (item) => (typeof item === 'object' ? item.selector : item),
      )
    expect(selectorsOf(page)).toEqual(
      expect.arrayContaining(["CallExpression[callee.name='cn'] > ConditionalExpression"]),
    )
    expect(selectorsOf(root)).toEqual(
      expect.arrayContaining(["CallExpression[callee.name='cn'] > ConditionalExpression"]),
    )
  })
})
describe('arbitrary Tailwind values', () => {
  const restrictedPattern = (options?: ConfigOptions) => {
    const config = createNextConfig({ tailwindEntryPoint: TAILWIND_ENTRY, ...options })
    const rule = mainBlock(config).rules?.['better-tailwindcss/no-restricted-classes'] as [
      string,
      { restrict: { pattern: string }[] },
    ]
    const [restriction] = rule[1].restrict
    if (!restriction) throw new Error('no-restricted-classes was wired with an empty restrict list')
    return restriction.pattern
  }
  it('bans a bracketed value with no allow-list entry', () => {
    const pattern = restrictedPattern()
    expect('text-[11px]'.match(pattern)).not.toBeNull()
    expect('data-[state=open]:opacity-100'.match(pattern)).toBeNull()
  })
  it('exempts a prefix named in allowArbitraryClasses', () => {
    const pattern = restrictedPattern({ allowArbitraryClasses: ['grid-cols'] })
    expect('grid-cols-[200px_1fr]'.match(pattern)).toBeNull()
    expect('!grid-cols-[200px_1fr]'.match(pattern)).toBeNull()
    expect('md:!grid-cols-[200px_1fr]'.match(pattern)).toBeNull()
    expect('text-[11px]'.match(pattern)).not.toBeNull()
  })
  it('does nothing when tailwindEntryPoint is unset', () => {
    expect(mainBlock(createNextConfig()).rules).not.toHaveProperty(
      'better-tailwindcss/no-restricted-classes',
    )
  })
})
describe('module boundaries', () => {
  it('restricts next.config.* and the listed modules to relative imports only', () => {
    const config = createNextConfig({ nextConfigModules: ['src/env.ts'] })
    const override = config.find(
      (entry) => Array.isArray(entry.files) && entry.files.includes('src/env.ts'),
    )
    expect(override?.files).toEqual(expect.arrayContaining(['next.config.{ts,mts,cts}', 'src/env.ts']))
    expect(override?.rules?.['no-restricted-imports']).toEqual(['error', { patterns: ['@/*'] }])
  })
  it('names only next.config files the default ignores leave lintable, since *.config.js and *.config.mjs are ignored', async () => {
    const eslint = new ESLint({
      cwd: process.cwd(),
      overrideConfigFile: true,
      overrideConfig: createNextConfig({ nextConfigModules: ['src/env.ts'] }),
    })
    await expect(eslint.isPathIgnored('next.config.js')).resolves.toBe(true)
    await expect(eslint.isPathIgnored('next.config.mjs')).resolves.toBe(true)
    for (const path of ['next.config.ts', 'next.config.mts', 'next.config.cts', 'src/env.ts']) {
      await expect(eslint.isPathIgnored(path)).resolves.toBe(false)
    }
  })
  it('adds no override when nextConfigModules is left empty', () => {
    const config = createNextConfig()
    expect(
      config.some((entry) => Array.isArray(entry.files) && entry.files[0]?.startsWith('next.config')),
    ).toBe(false)
  })
  it('keeps utils/ pure: server-only, next, react and the app/lib aliases are all restricted', () => {
    const override = createBaseConfig().find(
      (entry) => Array.isArray(entry.files) && entry.files[0] === '**/utils/**',
    )
    expect(override?.rules?.['no-restricted-imports']).toEqual([
      'error',
      { patterns: ['server-only', 'next/*', 'react', '@/lib/*', '@/app/*'] },
    ])
  })
})
describe('max-lines', () => {
  it('caps a module at 300 lines, skipping blank lines and comments', () => {
    expect(mainBlock(createBaseConfig()).rules?.['max-lines']).toEqual([
      'error',
      { max: 300, skipBlankLines: true, skipComments: true },
    ])
  })
  it('exempts test files and the copy/ folder', () => {
    const override = createBaseConfig().find(
      (entry) => Array.isArray(entry.files) && entry.files.includes('**/copy/**'),
    )
    expect(override?.files).toEqual(expect.arrayContaining(['**/*.test.*', '**/copy/**']))
    expect(override?.rules).toEqual({ 'max-lines': 'off' })
  })
})
describe('strictExportGlobs', () => {
  it('leaves soujvnunes/one-export-per-file unwired with no globs', () => {
    const rules = createBaseConfig().flatMap((entry) => Object.keys(entry.rules ?? {}))
    expect(rules).not.toContain('soujvnunes/one-export-per-file')
  })
  it('wires it at error on the globs given', () => {
    const override = createBaseConfig({ strictExportGlobs: ['src/features/*/index.ts'] }).find(
      (entry) => entry.rules?.['soujvnunes/one-export-per-file'],
    )
    expect(override?.files).toEqual(['src/features/*/index.ts'])
    expect(override?.rules).toEqual({ 'soujvnunes/one-export-per-file': 'error' })
  })
})
