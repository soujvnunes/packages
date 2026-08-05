import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'

import { createBaseConfig, createNextConfig, type ConfigOptions } from './index'

const TAILWIND_ENTRY = './app/tailwind.config.css'

// The one block carrying this package's own plugins, rules and settings, as opposed to the recommended sets it spreads in.
const mainBlock = (config: Linter.Config[]) => {
  const block = config.find((entry) => entry.files?.[0] === '**/*.{js,jsx,ts,tsx}')

  if (!block) throw new Error('The main config block is missing from the flat config.')

  return block
}

const importGroups = (config: Linter.Config[]) => {
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
    const extra: Linter.Config = { files: ['custom/**'], rules: { 'no-var': 'off' } }
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
