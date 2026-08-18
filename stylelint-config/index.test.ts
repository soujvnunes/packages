import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createConfig } from './index'
const atRuleIgnores = (config: ReturnType<typeof createConfig>) => {
  const rule = config.rules?.['at-rule-no-unknown'] as [boolean, { ignoreAtRules: string[] }]
  return rule[1].ignoreAtRules
}
describe('createConfig', () => {
  it('resolves the standard config to a path that exists, so a pnpm consumer can load it', () => {
    const [extended = ''] = createConfig().extends as string[]
    expect(extended).toMatch(/^\//)
    expect(existsSync(extended)).toBe(true)
  })
  it('allows the Tailwind v4 at-rules that stylelint does not know', () => {
    expect(atRuleIgnores(createConfig())).toEqual(
      expect.arrayContaining(['theme', 'utility', 'variant', 'custom-variant', 'apply', 'source']),
    )
  })
  it('carries the house deviations from the standard rules', () => {
    expect(createConfig().rules).toMatchObject({
      'import-notation': 'string',
      'color-function-notation': 'modern',
      'alpha-value-notation': 'percentage',
      'no-descending-specificity': null,
      'selector-class-pattern': null,
      'keyframes-name-pattern': null,
      'custom-property-pattern': null,
    })
  })
  it('merges the rules passed in onto the base rules', () => {
    const config = createConfig({ rules: { 'unit-allowed-list': ['rem', 'px'] } })
    expect(config.rules).toMatchObject({
      'unit-allowed-list': ['rem', 'px'],
      'import-notation': 'string',
    })
  })
  it('lets a passed rule override a base rule of the same name', () => {
    expect(createConfig({ rules: { 'import-notation': 'url' } }).rules).toMatchObject({
      'import-notation': 'url',
    })
  })
  it('replaces a non-rules option rather than merging it', () => {
    const config = createConfig({ ignoreFiles: ['app/tailwind.config.css'] })
    expect(config.ignoreFiles).toEqual(['app/tailwind.config.css'])
  })
  it('returns a new rules object each call, so one consumer cannot mutate another', () => {
    createConfig({ rules: { 'import-notation': 'url' } })
    expect(createConfig().rules).toMatchObject({ 'import-notation': 'string' })
  })
})
