import { describe, expect, it } from 'vitest'
import { lintWithRule } from './lintWithRule'
import { ruleSetups } from './ruleSetups'
const lint = (languageOptions: Parameters<typeof lintWithRule>[0], code: string) =>
  lintWithRule(languageOptions, code, { 'soujvnunes/one-export-per-file': 'error' }, 'a.ts').map(
    ({ fatal, message, messageId }) => (fatal ? message : messageId),
  )
const KEEPS: [string, string][] = [
  ['a single const export', 'export const a = 1'],
  ['a single function export', 'export function a() { return 1 }'],
  ['a single class export', 'export class A {}'],
  ['a single default export', 'export default function a() { return 1 }'],
  ['a single named re-export', "export { a } from './a'"],
  ['no export at all', 'const a = 1'],
  ['an export-all re-export, which is exempt', "export * from './a'"],
]
const REPORTS: [string, string][] = [
  ['two const declarators in one export', 'export const a = 1, b = 2'],
  ['two separate const exports', 'export const a = 1\nexport const b = 2'],
  ['a function export beside a const export', 'export const a = 1\nexport function b() { return 2 }'],
  ['a named export beside a default export', 'export const a = 1\nexport default 2'],
  ['two named re-export specifiers', "export { a, b } from './ab'"],
]
describe.each(ruleSetups.slice(0, 1))('one-export-per-file under %s', (_setup, setup) => {
  it.each(KEEPS)('keeps %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(REPORTS)('reports %s', (_case, code) => {
    expect(lint(setup, code)).toEqual(['multiple'])
  })
})
const TYPESCRIPT_KEEPS: [string, string][] = [
  [
    'a value export beside an interface, which is free',
    'export const a = 1\nexport interface B { id: string }',
  ],
  [
    'a value export beside a type alias, which is free',
    'export const a = 1\nexport type B = { id: string }',
  ],
  ['an interface and a type alias, both free', 'export interface A { id: string }\nexport type B = A'],
  [
    'a value export beside a type-only named export',
    "export const a = 1\nexport type { B } from './b'",
  ],
  [
    'a value export beside a type-only re-export specifier',
    "export const a = 1\nexport { type B } from './b'",
  ],
]
const TYPESCRIPT_REPORTS: [string, string][] = [
  ['two enums', 'export enum A { X }\nexport enum B { Y }'],
  ['a value export beside an enum, which counts', 'export const a = 1\nexport enum B { X }'],
]
describe.each(ruleSetups.slice(1))(
  'one-export-per-file on TypeScript syntax under %s',
  (_setup, setup) => {
    it.each(TYPESCRIPT_KEEPS)('keeps %s', (_case, code) => {
      expect(lint(setup, code)).toEqual([])
    })
    it.each(TYPESCRIPT_REPORTS)('reports %s', (_case, code) => {
      expect(lint(setup, code)).toEqual(['multiple'])
    })
  },
)
