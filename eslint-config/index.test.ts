import { Linter, RuleTester } from 'eslint'
import type { Linter as LinterTypes } from 'eslint'
import { describe, expect, it } from 'vitest'
import { oneLineComments, oneLineCommentsPlugin } from './oneLineComments'
import { createBaseConfig, createNextConfig, type ConfigOptions } from './index'
const TAILWIND_ENTRY = './app/tailwind.config.css'
// The one block carrying this package's own plugins, rules and settings, as opposed to the recommended sets it spreads in.
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
  it('exempts root config files from the default-export and syntax bans', () => {
    const override = createBaseConfig().find((entry) => entry.files?.[0] === '*.{mjs,js,ts,mts,cts}')
    expect(override?.rules).toMatchObject({
      'import-x/no-default-export': 'off',
      'no-restricted-syntax': 'off',
    })
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
  it('exempts the Next file conventions, which must default-export', () => {
    const override = createNextConfig().find((entry) =>
      entry.files?.[0]?.includes('{default,page,layout'),
    )
    expect(override?.rules).toMatchObject({
      'import-x/no-default-export': 'off',
      'no-restricted-syntax': 'off',
    })
  })
  it.each(['proxy', 'middleware'])('exempts %s, since a repo can be on either name', (name) => {
    const override = createNextConfig().find((entry) =>
      entry.files?.[0]?.includes('{default,page,layout'),
    )
    expect(override?.files?.[0]).toContain(`,${name},`)
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
  const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  })
  const lint = (code: string, filename?: string) =>
    new Linter().verify(
      code,
      {
        files: ['**/*.{js,jsx}'],
        plugins: { soujvnunes: oneLineCommentsPlugin },
        languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
        rules: { 'soujvnunes/one-line-comments': 'error' },
      },
      filename ?? 'a.js',
    )
  const fix = (code: string) =>
    new Linter().verifyAndFix(code, {
      plugins: { soujvnunes: oneLineCommentsPlugin },
      rules: { 'soujvnunes/one-line-comments': 'error' },
    }).output
  it('passes its own RuleTester suite', () => {
    ruleTester.run('one-line-comments', oneLineComments, {
      valid: [
        '// One line, however long it runs, which is the whole point and stays legal at any length.',
        'const a = 1\n// A comment separated from another by code.\nconst b = 2\n// Another one.',
        '/** Single-line JSDoc above the symbol it documents. */\nconst a = 1',
        '// A module preamble, which is a different comment from the JSDoc under it.\n/** Doc for a. */\nconst a = 1',
        'const f = (/** the id */ id) => id',
        'const a = 1 // trailing\nconst b = 2 // trailing on the next line',
        'const a = 1 // trailing\n// own-line under a trailing one',
        'const a = `\n// not a comment, it is template text\n// neither is this\n`',
        '// eslint-disable-next-line no-console\n// prose under a directive is exempt, joining would bury it\nconsole.log(1)',
        '// @ts-expect-error the types are wrong here\n// eslint-disable-next-line no-console\nconsole.log(1)',
        '// prettier-ignore\n// prose under prettier-ignore, which tolerates no trailing text\nconst m = [1, 2]',
        '/* eslint-disable no-console */\nconsole.log(1)',
        '/* global window */\nwindow.a = 1',
        '/*! Preserved banner, which has no line form. */\nconst a = 1',
        '#!/usr/bin/env node\n// the interpreter line is not a comment line\nconst a = 1',
      ],
      invalid: [
        {
          code: '// First line.\n// Second line.\nconst a = 1',
          output: '// First line. Second line.\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '// One.\n// Two.\n// Three.\nconst a = 1',
          output: '// One. Two. Three.\nconst a = 1',
          errors: [{ messageId: 'adjacent' }],
        },
        {
          code: '// First paragraph.\n//\n// Second paragraph.\nconst a = 1',
          output: null,
          errors: [{ messageId: 'paragraphs' }],
        },
        {
          code: '/**\n * Shared Prettier config.\n */\nconst a = 1',
          output: '/** Shared Prettier config. */\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/*\n  Plain block.\n*/\nconst a = 1',
          output: '// Plain block.\nconst a = 1',
          errors: [{ messageId: 'block' }],
        },
        {
          code: 'foo() /* one\n  two */\nbar()',
          output: 'foo() // one two\nbar()',
          errors: [{ messageId: 'block' }],
        },
        {
          code: '/* one\n  two */ foo()',
          output: '/* one two */ foo()',
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
          code: '/** Orphan doc. */\n// note\nconst a = 1',
          output: null,
          errors: [{ messageId: 'orphanDoc' }, { messageId: 'adjacent' }],
        },
        {
          code: 'const a = 1\n/** Nothing under it. */',
          output: null,
          errors: [{ messageId: 'orphanDoc' }],
        },
      ],
    })
  })
  it('keeps the JSDoc marker, so a collapsed doc comment still carries its tags', () => {
    const [result] = fix('/**\n * Old.\n * @deprecated use next\n */\nexport const a = 1').split('\n')
    expect(result).toBe('/** Old. @deprecated use next */')
  })
  it('rewrites a plain block as a line comment, then joins it with its neighbour on the next pass', () => {
    expect(fix('// one\n/* two */\nconst a = 1')).toBe('// one two\nconst a = 1')
  })
  it('refuses to collapse a block that is the only line break before a return value', () => {
    const report = lint('function f() {\n  return /* one\n  two */ 42\n}')
    expect(report).toHaveLength(1)
    expect(report[0]?.fix).toBeUndefined()
  })
  it('leaves JSX block comments alone, since JSX has no line form', () => {
    const report = lint(
      'const a = (\n  <p /* on the tag */ id="x">\n    {/* one */}\n    text\n    {/** two */}\n  </p>\n)',
      'a.jsx',
    )
    expect(report).toHaveLength(0)
  })
  it('reports adjacent JSX comment containers without fixing them', () => {
    const report = lint('const a = (\n  <p>\n    {/* one */}\n    {/* two */}\n  </p>\n)', 'a.jsx')
    expect(report).toHaveLength(1)
    expect(report[0]?.messageId).toBe('adjacent')
    expect(report[0]?.fix).toBeUndefined()
  })
  it('lets a line comment sit above a JSDoc, which binds to the symbol below it', () => {
    expect(lint('// note\n/** @deprecated use next */\nexport const a = 1')).toHaveLength(0)
  })
  it('reports a JSDoc with another comment under it without fixing it, so its tags survive', () => {
    const report = lint('/** @deprecated use next */\n// note\nexport const a = 1')
    expect(report.map((message) => message.messageId)).toEqual(['orphanDoc', 'adjacent'])
    expect(report.every((message) => message.fix === undefined)).toBe(true)
  })
  it('treats @ts-check as a directive, since the pragma only counts when it stands alone', () => {
    expect(lint('// @ts-check\n// prose under it\nconst a = 1')).toHaveLength(0)
  })
  it('does not mistake prose for a line directive, which would exempt it silently', () => {
    const report = lint('// global state lives here\n// and it is shared\nconst a = 1')
    expect(report).toHaveLength(1)
    expect(report[0]?.messageId).toBe('adjacent')
  })
  it('is wired into the shared config at error, on a glob that reaches .mjs and .cjs', () => {
    const block = createBaseConfig().find((entry) => entry.rules?.['soujvnunes/one-line-comments'])
    expect(block?.rules?.['soujvnunes/one-line-comments']).toBe('error')
    expect(block?.plugins).toHaveProperty('soujvnunes')
    expect(block?.files?.[0]).toBe('**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}')
  })
})
