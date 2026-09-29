import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { lintWithRule } from './lintWithRule'
import { soujvnunesPlugin } from './plugin'
import { ruleSetups } from './ruleSetups'
type Setup = Parameters<typeof lintWithRule>[0]
const RULE: Linter.RulesRecord = { 'soujvnunes/no-comments': 'error' }
const lint = (setup: Setup, code: string) =>
  lintWithRule(setup, code, RULE)
    .filter(({ fatal, ruleId }) => fatal ?? ruleId === 'soujvnunes/no-comments')
    .map(({ fatal, message, messageId }) => (fatal ? message : messageId))
const fixOnce = (setup: Setup, code: string) => {
  const fixes = lintWithRule(setup, code, RULE)
    .flatMap(({ fix }) => (fix ? [fix] : []))
    .sort((a, b) => a.range[0] - b.range[0] || a.range[1] - b.range[1])
  let output = ''
  let cursor = 0
  let lastEnd = -1
  for (const fix of fixes) {
    if (fix.range[0] <= lastEnd) continue
    output += code.slice(cursor, fix.range[0]) + fix.text
    cursor = fix.range[1]
    lastEnd = fix.range[1]
  }
  return output + code.slice(cursor)
}
const KEEPS: [string, string][] = [
  ['eslint-disable-next-line', '// eslint-disable-next-line no-console\nconsole.log(1)'],
  ['a block eslint-disable', '/* eslint-disable no-console */\nconsole.log(1)'],
  ['@ts-expect-error with a reason', '// @ts-expect-error x\nconst a = b'],
  ['@ts-check', '// @ts-check\nconst a = 1'],
  ['prettier-ignore', '// prettier-ignore\nconst m = [1,  2]'],
  ['istanbul ignore', '/* istanbul ignore next */\nconst a = 1'],
  ['v8 ignore', '/* v8 ignore next */\nconst a = 1'],
  ['node:coverage', '/* node:coverage disable */\nconst a = 1'],
  ['an inline @__PURE__', 'const a = /* @__PURE__ */ f()'],
  ['a sourceMappingURL', 'const a = 1\n//# sourceMappingURL=a.js.map'],
  ['a triple-slash reference', '/// <reference types="x" />\nconst a = 1'],
  ['a global declaration', '/* global a */\na()'],
  ['a @jsx pragma', '/** @jsx h */\nconst a = 1'],
  ['@vitest-environment', '// @vitest-environment jsdom\nconst a = 1'],
  ['gitleaks:allow', "const key = 'x' // gitleaks:allow"],
  ['a /*! banner', '/*! banner */\nconst a = 1'],
  ['an interpreter line', '#!/usr/bin/env node\nconst a = 1'],
  ['a JSDoc above export const', '/** Doc. */\nexport const a = 1'],
  ['a JSDoc above export function', '/** Doc. */\nexport function f() {}'],
  ['a JSDoc above export default', '/** Doc. */\nexport default 1'],
  [
    'a JSDoc on an exported class, its fields and its methods',
    '/** Doc. */\nexport class A {\n  /** Field. */\n  b = 1\n  /** Method. */\n  c() {}\n}',
  ],
  [
    'a JSDoc above a directive above an export',
    '/** Doc. */\n// eslint-disable-next-line no-var\nexport var a = 1',
  ],
  ['// inside a template literal', 'const a = `\n// not a comment\n`'],
  [
    'a JSX eslint-disable container',
    'export const A = () => (\n  <p>\n    {/* eslint-disable-next-line @next/next/no-img-element -- reason */}\n    <img alt="" />\n  </p>\n)',
  ],
  [
    'a JSX @ts-expect-error container',
    'export const A = () => (\n  <p>\n    {/* @ts-expect-error */}\n    <b x="1" />\n  </p>\n)',
  ],
]
const TYPESCRIPT_KEEPS: [string, string][] = [
  [
    'a JSDoc on exported interface members',
    '/** Doc. */\nexport interface A {\n  /** Field. */\n  b: string\n  /** Method. */\n  c(): void\n}',
  ],
  [
    'a JSDoc on exported type literal members',
    '/** Doc. */\nexport type A = {\n  /** Field. */\n  b: string\n  /** Nested. */\n  c: {\n    /** Deep. */\n    d: number\n  }\n}',
  ],
]
const FIXES: [string, string, string, string[]][] = [
  ['an own-line // on the first line', '// x\nconst a = 1', 'const a = 1', ['line']],
  [
    'an own-line // in the middle',
    'const a = 1\n// x\nconst b = 2',
    'const a = 1\nconst b = 2',
    ['line'],
  ],
  ['an own-line // on the last line with no newline', 'const a = 1\n// x', 'const a = 1', ['line']],
  [
    'two adjacent // lines, both in one pass',
    'const a = 1\n// x\n// y\nconst b = 2',
    'const a = 1\nconst b = 2',
    ['line', 'line'],
  ],
  ['a trailing // after code', 'const a = 1 // x\nconst b = 2', 'const a = 1\nconst b = 2', ['line']],
  [
    'a block between two tokens',
    'function f() {\n  return /* x */ 1\n}',
    'function f() {\n  return 1\n}',
    ['block'],
  ],
  ['an own-line block', '/* x */\nconst a = 1', 'const a = 1', ['block']],
  [
    'a multi-line block',
    'const a = 1\n/*\n  x\n  y\n*/\nconst b = 2',
    'const a = 1\nconst b = 2',
    ['block'],
  ],
  ['a JSDoc above a non-exported const', '/** Doc. */\nconst a = 1', 'const a = 1', ['orphanDoc']],
  [
    'a JSDoc above return',
    'function f() {\n  /** Doc. */\n  return 1\n}',
    'function f() {\n  return 1\n}',
    ['orphanDoc'],
  ],
  ['a JSDoc above an import', "/** Doc. */\nimport a from 'a'", "import a from 'a'", ['orphanDoc']],
  ['a JSDoc above an expression statement', '/** Doc. */\nf()', 'f()', ['orphanDoc']],
  [
    "a JSDoc above 'use client'",
    "/** Doc. */\n'use client'\nexport const a = 1",
    "'use client'\nexport const a = 1",
    ['orphanDoc'],
  ],
  [
    'a JSDoc trailing code, even with an export under it',
    'const a = 1 /** Doc. */\nexport const b = 2',
    'const a = 1\nexport const b = 2',
    ['orphanDoc'],
  ],
  [
    'an own-line JSX container',
    'export const A = () => (\n  <p>\n    {/* x */}\n    text\n  </p>\n)',
    'export const A = () => (\n  <p>\n    text\n  </p>\n)',
    ['jsx'],
  ],
]
const UNFIXED: [string, string, string[]][] = [
  ['an inline JSX container between text', 'export const A = () => <p>a {/* x */} b</p>', ['jsx']],
  ['a block in a JSX tag', 'export const A = () => <p /* x */ id="a" />', ['attribute']],
  ['a multi-line block with code on both of its edges', 'a /* x\n */ (b)', ['block']],
  ['a misplaced JSDoc holding a tag', '/** Old. @deprecated use b */\nconst a = 1', ['orphanDoc']],
  [
    'a JSDoc on an export holding an em dash',
    `/** Old ${String.fromCodePoint(0x2014)} new. */\nexport const a = 1`,
    ['emDash'],
  ],
]
describe.each(ruleSetups)('no-comments under %s', (_setup, setup) => {
  it.each(KEEPS)('keeps %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(FIXES)('removes %s', (_case, code, output, messageIds) => {
    expect(lint(setup, code)).toEqual(messageIds)
    expect(fixOnce(setup, code)).toBe(output)
  })
  it.each(UNFIXED)('reports %s and leaves it to the author', (_case, code, messageIds) => {
    expect(lint(setup, code)).toEqual(messageIds)
    expect(fixOnce(setup, code)).toBe(code)
  })
})
describe.each(ruleSetups.slice(1))('no-comments on TypeScript syntax under %s', (_setup, setup) => {
  it.each(TYPESCRIPT_KEEPS)('keeps %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
})
describe('no-comments beside one-line-comments', () => {
  it('converges to code plus the JSDoc on the export, collapsed to one line', () => {
    const code = '// a\n// b\n/*\n * c\n */\nconst a = 1 // d\n/**\n * Doc.\n */\nexport const b = 2\n'
    const { output } = new Linter().verifyAndFix(code, {
      plugins: { soujvnunes: soujvnunesPlugin },
      rules: { 'soujvnunes/no-comments': 'error', 'soujvnunes/one-line-comments': 'error' },
    })
    expect(output).toBe('const a = 1\n/** Doc. */\nexport const b = 2\n')
  })
})
