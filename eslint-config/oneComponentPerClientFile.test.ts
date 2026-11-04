import { describe, expect, it } from 'vitest'
import { lintWithRule } from './lintWithRule'
import { ruleSetups } from './ruleSetups'
const NAMES = /exports `([^`]+)`; `([^`]+)`/u
const lint = (languageOptions: Parameters<typeof lintWithRule>[0], code: string) =>
  lintWithRule(languageOptions, code, { 'soujvnunes/one-component-per-client-file': 'error' }).map(
    ({ fatal, message }) => {
      if (fatal) return message
      const [, component, name] = NAMES.exec(message) ?? []
      return `${component}:${name}`
    },
  )
const STATE = "'use client'\nimport { useState } from 'react'\n"
const PRICE = 'export const Price = () => { const [n] = useState(1); return <p>{format(n)}</p> }'
const KEEPS: [string, string][] = [
  [
    'a client file with one exported component',
    `${STATE}export const Toggle = () => { const [on, setOn] = useState(false); return <button onClick={() => setOn(!on)}>{String(on)}</button> }`,
  ],
  [
    'one exported component beside a cva() const, which is not a function',
    `${STATE}import { cva } from 'class-variance-authority'\nconst button = cva('px-2')\nexport const Toggle = () => { const [on] = useState(false); return <button className={button()}>{String(on)}</button> }`,
  ],
  [
    'a memo(() => ...) component',
    "'use client'\nimport { memo } from 'react'\nexport const Card = memo(() => <div>Card</div>)",
  ],
  [
    'a helper that reads window, which needs the browser',
    "'use client'\nconst scrollTop = () => window.scrollY\nexport const Top = () => <p>{scrollTop()}</p>",
  ],
  [
    'a helper that reads a browser global through globalThis',
    "'use client'\nconst width = () => globalThis.innerWidth\nexport const Size = () => <p>{width()}</p>",
  ],
  [
    'a private sub-component that calls useState',
    `${STATE}const Counter = () => { const [n] = useState(0); return <span>{n}</span> }\nexport const Panel = () => <section><Counter /></section>`,
  ],
  [
    'a private sub-component that hands an inline function to another component',
    `${STATE}import { Table } from 'ui'\nconst Rows = () => <Table renderRow={(row) => <tr>{row}</tr>} />\nexport const Panel = () => { const [n] = useState(0); return <section>{n}<Rows /></section> }`,
  ],
  [
    'a private sub-component that hands an inline render function to another component as its child',
    `${STATE}import { Query } from 'ui'\nconst Result = () => <Query>{(data) => <p>{data}</p>}</Query>\nexport const Panel = () => { const [n] = useState(0); return <section>{n}<Result /></section> }`,
  ],
  [
    'a closure inside the component, which is not module level',
    `${STATE}export const Form = () => { const [v, setV] = useState(''); const onChange = (event) => setV(event.target.value); function reset() { setV('') } return <input value={v} onChange={onChange} onBlur={reset} /> }`,
  ],
  [
    'a file with no directive and three functions, which a server parent can import',
    'const a = () => 1\nfunction b() { return 2 }\nexport const C = () => <p>{a() + b()}</p>',
  ],
  [
    'a client file that exports no component, so there is no one component to name',
    `${STATE}export const useOpen = () => useState(false)\nconst label = () => 'Open'`,
  ],
]
const REPORTS: [string, string, string[]][] = [
  ['a lowercase arrow const', `${STATE}const format = (n) => n.toFixed(2)\n${PRICE}`, ['Price:format']],
  [
    'a lowercase function declaration',
    `${STATE}function format(n) { return n.toFixed(2) }\n${PRICE}`,
    ['Price:format'],
  ],
  [
    'an exported helper, even one that comes before the component',
    `${STATE}export const format = (n) => n.toFixed(2)\n${PRICE}`,
    ['Price:format'],
  ],
  [
    'a private PascalCase component that calls no hook',
    `${STATE}const Row = () => <li>Row</li>\nexport const List = () => { const [rows] = useState([1]); return <ul>{rows.map((row) => <Row key={row} />)}</ul> }`,
    ['List:Row'],
  ],
  [
    'a static sub-component that maps its props into another component',
    `${STATE}import { Item } from 'ui'\nconst Rows = ({ items }) => <ul>{items.map((i) => <Item key={i} label={i} />)}</ul>\nexport const L = () => { const [r] = useState([1]); return <Rows items={r} /> }`,
    ['L:Rows'],
  ],
  [
    'a render helper handed to map, whose argument reaches another component',
    `${STATE}import { Item } from 'ui'\nconst renderRow = (row) => <Item key={row.id} label={row.label} />\nexport const L = () => { const [r] = useState([]); return <ul>{r.map(renderRow)}</ul> }`,
    ['L:renderRow'],
  ],
  [
    'a second exported component',
    `${STATE}export const A = () => { const [a] = useState(1); return <p>{a}</p> }\nexport const B = () => <p>B</p>`,
    ['A:B'],
  ],
  [
    'an async helper',
    `${STATE}const load = async () => { const response = await fetch('/api'); return response.json() }\nexport const Feed = () => { const [items] = useState(load); return <p>{String(items)}</p> }`,
    ['Feed:load'],
  ],
  [
    'a helper beside a component exported through a specifier',
    `${STATE}const Panel = () => { const [n] = useState(0); return <p>{format(n)}</p> }\nconst format = (n) => String(n)\nexport { Panel }`,
    ['Panel:format'],
  ],
  [
    'a helper beside a memo() default export of a local component',
    "'use client'\nimport { memo } from 'react'\nconst Inner = () => <p>{label()}</p>\nfunction label() { return 'x' }\nexport default memo(Inner)",
    ['Inner:label'],
  ],
]
describe.each(ruleSetups)('one-component-per-client-file under %s', (_setup, setup) => {
  it.each(KEEPS)('keeps %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(REPORTS)('reports %s', (_case, code, expected) => {
    expect(lint(setup, code)).toEqual(expected)
  })
})
const TYPESCRIPT_KEEPS: [string, string][] = [
  [
    'a type alias beside the component',
    `${STATE}type Props = { label: string }\nexport const Field = ({ label }: Props) => { const [v] = useState(label); return <p>{v}</p> }`,
  ],
  [
    'a client file whose only export is type-only, so it exports no component',
    "'use client'\nconst helper = () => 1\nconst Inner = () => <p>{helper()}</p>\nexport type { Inner }",
  ],
]
const TYPESCRIPT_REPORTS: [string, string, string[]][] = [
  [
    'a helper behind a satisfies wrapper',
    `${STATE}const format = ((n: number) => n.toFixed(2)) satisfies (n: number) => string\n${PRICE}`,
    ['Price:format'],
  ],
]
describe.each(ruleSetups.slice(1))(
  'one-component-per-client-file on TypeScript syntax under %s',
  (_setup, setup) => {
    it.each(TYPESCRIPT_KEEPS)('keeps %s', (_case, code) => {
      expect(lint(setup, code)).toEqual([])
    })
    it.each(TYPESCRIPT_REPORTS)('reports %s', (_case, code, expected) => {
      expect(lint(setup, code)).toEqual(expected)
    })
  },
)
