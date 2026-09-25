import { existsSync } from 'node:fs'
import { format } from 'prettier'
import { describe, expect, it } from 'vitest'
import { createConfig } from './index'
describe('createConfig', () => {
  it('carries the house style', () => {
    expect(createConfig()).toMatchObject({
      semi: false,
      singleQuote: true,
      jsxSingleQuote: false,
      trailingComma: 'all',
      printWidth: 104,
      bracketSameLine: true,
      bracketSpacing: true,
      singleAttributePerLine: false,
      objectWrap: 'collapse',
      proseWrap: 'never',
    })
  })
  it('keeps a short multi-attribute element on one line, and breaks one past the width per attribute', async () => {
    const config = createConfig({ plugins: [], tailwindFunctions: [], parser: 'typescript' })
    const short = 'const a = <div id="x" className="y" />\n'
    expect(await format(short, config)).toBe(short)
    const long = await format(
      `const b = <C a="${'a'.repeat(40)}" b="${'b'.repeat(40)}" c="${'c'.repeat(40)}" />\n`,
      config,
    )
    expect(long.split('\n').filter((line) => /^\s+[abc]="/.test(line))).toHaveLength(3)
  })
  it('resolves the Tailwind plugin to a path that exists, so a pnpm consumer can load it', () => {
    const [plugin = ''] = createConfig().plugins as string[]
    expect(plugin).toMatch(/^\//)
    expect(existsSync(plugin)).toBe(true)
  })
  it('defaults the stylesheet to the app/ layout, and sorts the class-name helpers', () => {
    expect(createConfig()).toMatchObject({
      tailwindStylesheet: './app/tailwind.config.css',
      tailwindFunctions: ['cva', 'twMerge', 'cn'],
    })
  })
  it('takes a stylesheet path for the src/ layout', () => {
    const config = createConfig({ tailwindStylesheet: './src/app/tailwind.config.css' })
    expect(config).toMatchObject({ tailwindStylesheet: './src/app/tailwind.config.css' })
  })
  it('drops Tailwind entirely for a non-Tailwind repo', () => {
    expect(createConfig({ plugins: [], tailwindFunctions: [] })).toMatchObject({
      plugins: [],
      tailwindFunctions: [],
    })
  })
  it('lets any Prettier option override the base', () => {
    expect(createConfig({ semi: true, printWidth: 80 })).toMatchObject({ semi: true, printWidth: 80 })
  })
  it('keeps the rest of the base when one option is overridden', () => {
    expect(createConfig({ printWidth: 80 })).toMatchObject({ singleQuote: true, semi: false })
  })
  it('returns a new object each call, so one consumer cannot mutate another', () => {
    const first = createConfig()
    first.semi = true
    expect(createConfig().semi).toBe(false)
  })
})
