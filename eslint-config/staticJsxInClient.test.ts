import { Linter } from 'eslint'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { soujvnunesPlugin } from './plugin'
// Each case runs twice: once bare, and once under what the Next preset gives a `.tsx` file, since a declared global or a TypeScript lib global resolves differently from an undeclared one.
const SETUPS: [string, Linter.LanguageOptions][] = [
  ['espree with no globals', {}],
  [
    "the Next preset's TypeScript parser and browser globals",
    { parser: tseslint.parser, globals: globals.browser, parserOptions: { lib: ['dom', 'esnext'] } },
  ],
]
const COUNT = /: (\d+) elements/u
// Each finding as its element count, so a case asserts both where the rule reports and how big it says the block is.
const lint = (languageOptions: Linter.LanguageOptions, code: string, minElements = 3) =>
  new Linter()
    .verify(
      code,
      {
        files: ['**/*.tsx'],
        plugins: { soujvnunes: soujvnunesPlugin },
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ...languageOptions,
          parserOptions: { ecmaFeatures: { jsx: true }, ...languageOptions.parserOptions },
        },
        linterOptions: { reportUnusedDisableDirectives: 'off' },
        rules: { 'soujvnunes/no-static-jsx-in-client': ['error', { minElements }] },
      },
      'component.tsx',
    )
    .map(({ fatal, message }) => (fatal ? message : Number(COUNT.exec(message)?.[1])))
const PASSES: [string, string][] = [
  [
    'static markup in a module with no directive, which a server parent can render',
    'export const Card = () => <div><h2>Title</h2><p>Body</p></div>',
  ],
  [
    'markup that reads a prop at every level',
    "'use client'\nexport const A = ({ title }) => <div><h2>{title}</h2><p className={title}>x</p></div>",
  ],
  [
    'a handler on the root with two static children',
    "'use client'\nexport const A = ({ go }) => <div onClick={go}><h2>Title</h2><p>Body</p></div>",
  ],
  [
    'a spread on the root',
    "'use client'\nexport const A = (props) => <div {...props}><h2>Title</h2><p>Body</p></div>",
  ],
  [
    'a static subtree below the threshold, the size of an icon inside a button',
    "'use client'\nimport { Icon } from './ui'\nexport const A = ({ go }) => <button onClick={go}><span><Icon /></span></button>",
  ],
  [
    'a read of an import next to a prop',
    "'use client'\nimport { copy } from './copy'\nexport const A = ({ title }) => <div><h2>{copy.title}</h2><p>{title}</p></div>",
  ],
  [
    'a module `let`, which may change',
    "'use client'\nlet label = 'Name'\nexport const A = () => <div><label>{label}</label><input name=\"name\" /></div>",
  ],
  ['a static fragment of two', "'use client'\nexport const A = () => <><h2>Title</h2><p>Body</p></>"],
  [
    'browser globals, declared or not',
    "'use client'\nexport const Where = ({ go }) => <section onClick={go}><div><h2>{document.title}</h2><p>{window.location.href}</p></div></section>",
  ],
  [
    'a module constant holding a function, handed to a component',
    "'use client'\nimport { Chart } from 'chart'\nconst format = (v) => `${v}%`\nexport const Stats = ({ go }) => <section onClick={go}><div><Chart format={format} /><p>Label</p></div></section>",
  ],
  [
    'a module constant read from the browser',
    "'use client'\nconst PLATFORM = navigator.platform\nexport const A = () => <div><h2>{PLATFORM}</h2><p>a</p><p>b</p></div>",
  ],
  [
    'a tag chosen from state',
    "'use client'\nimport { useState } from 'react'\nexport const Card = () => { const [open] = useState(false); const Tag = open ? 'section' : 'div'; return <Tag><h2>Title</h2><p>Body</p></Tag> }",
  ],
  [
    'a dot into a named import',
    "'use client'\nimport { motion } from 'motion/react'\nexport const Fade = () => <motion.div><h2>Title</h2><p>Body</p></motion.div>",
  ],
  [
    'a bare import handed to a component, likely a function',
    "'use client'\nimport { formatPrice } from './format'\nimport { NumberFlow } from 'number-flow'\nexport const A = () => <div><NumberFlow format={formatPrice} /><p>a</p><p>b</p></div>",
  ],
]
const MORE_PASSES: [string, string][] = [
  [
    'an imported handler on a tag',
    "'use client'\nimport { track } from './analytics'\nexport const A = ({ open }) => <section hidden={open}><div onClick={track}><h2>Title</h2><p>Body</p></div></section>",
  ],
  [
    'an imported form action on a button',
    "'use client'\nimport { save } from './save'\nexport const A = ({ open }) => <section hidden={open}><form><button formAction={save}>Save</button><p>a</p></form></section>",
  ],
  [
    'a handler read from a module constant',
    "'use client'\nimport { track } from './analytics'\nconst HANDLERS = { click: track }\nexport const A = ({ open }) => <section hidden={open}><div onClick={HANDLERS.click}><h2>Title</h2><p>Body</p></div></section>",
  ],
  [
    'an import inside an object prop',
    "'use client'\nimport { formatPrice } from './format'\nimport { Chart } from 'chart'\nexport const A = ({ go }) => <section onClick={go}><div><Chart options={{ format: formatPrice }} /><p>a</p></div></section>",
  ],
  [
    'a namespace member handed to a component',
    "'use client'\nimport * as fmt from './format'\nimport { Chart } from 'chart'\nexport const A = ({ go }) => <section onClick={go}><div><Chart format={fmt.price} /><p>a</p></div></section>",
  ],
  [
    'a module constant aliasing an import',
    "'use client'\nimport { formatPrice } from './format'\nimport { Chart } from 'chart'\nconst FORMAT = formatPrice\nexport const A = ({ go }) => <section onClick={go}><div><Chart format={FORMAT} /><p>a</p></div></section>",
  ],
  [
    'markup a library callback builds',
    "'use client'\nexport const columns = [{ accessorKey: 'amount', header: () => <div className=\"text-right\"><span>Amount</span><small>BRL</small></div> }]",
  ],
  [
    'markup an event handler builds',
    "'use client'\nexport const A = ({ go }) => <button onClick={() => toast(<div><b>Saved</b><p>Done</p></div>)}>Save</button>",
  ],
  [
    'a static file that needs nothing from the client, which the directive rule owns',
    "'use client'\nexport const Card = () => <div><h2>Title</h2><p>Body</p></div>",
  ],
  [
    'a dot into a module-level object',
    "'use client'\nimport { Card } from './ui'\nconst UI = { Card }\nexport const A = ({ go }) => <UI.Card><h2>Title</h2><p>Body</p></UI.Card>",
  ],
  [
    'a context rendered as its own provider',
    "'use client'\nimport { ThemeContext } from './theme'\nexport const A = () => <ThemeContext value=\"dark\"><h2>Title</h2><p>Body</p></ThemeContext>",
  ],
  [
    'a component next/dynamic makes',
    "'use client'\nimport dynamic from 'next/dynamic'\nconst Map = dynamic(() => import('./map'), { ssr: false })\nexport const A = () => <section><Map /><h2>Title</h2><p>Body</p></section>",
  ],
]
const REPORTS: [string, string, number[]][] = [
  [
    'a directive kept by disabling the directive rule on its line',
    "// eslint-disable-next-line soujvnunes/no-needless-use-client -- a boundary for a dependency\n'use client'\nexport const Card = () => <section><h2>T</h2><p>a</p><p>b</p></section>",
    [4],
  ],
  [
    'an imported text child inside a fragment, which does not split the run',
    "'use client'\nimport { label } from './copy'\nexport const A = ({ go }) => <div onClick={go}><>{label}<h1>T</h1><p>a</p></><p>b</p></div>",
    [3],
  ],
  [
    'memo over a component binding as a static tag',
    "'use client'\nimport { memo } from 'react'\nconst RowBase = ({ id }) => <tr id={id} />\nconst Row = memo(RowBase)\nexport const Table = ({ go }) => <table onClick={go}><tbody><Row /><Row /></tbody></table>",
    [3],
  ],
  [
    'a static block inside a local provider, without the provider',
    "'use client'\nimport { createContext } from 'react'\nconst ThemeContext = createContext('light')\nexport const A = ({ children }) => <ThemeContext.Provider value=\"dark\"><main><h2>Title</h2><p>Body</p></main></ThemeContext.Provider>",
    [3],
  ],
  [
    'a run that an imported text child does not split',
    "'use client'\nimport { label } from './copy'\nexport const A = ({ go }) => <div onClick={go}><h1>T</h1>{label}<p>a</p><p>b</p></div>",
    [3],
  ],
  [
    'module-level markup',
    "'use client'\nconst EMPTY = <div><h2>Title</h2><p>Body</p></div>\nexport const A = ({ go }) => <button onClick={go}>{EMPTY}</button>",
    [3],
  ],
  [
    'a component inside memo and forwardRef',
    "'use client'\nimport { memo, forwardRef } from 'react'\nexport const Card = memo(forwardRef((props, ref) => <div ref={ref}><section><h2>Title</h2><p>Body</p></section></div>))\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'a read through a named import handed to a component, as a copy dictionary is',
    "'use client'\nimport { copy } from './copy'\nimport { Input } from './input'\nexport const A = () => <div><Input placeholder={copy.email} /><p>a</p></div>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'a static card once, at its outermost element',
    "'use client'\nexport const Card = () => <div className=\"card\"><h2>Title</h2><p>Body {'text'}</p></div>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'a run of static siblings under a dynamic form, as one block',
    '\'use client\'\nexport const Form = ({ go }) => <form onSubmit={go}><fieldset><label>Name</label><input name="name" required /></fieldset><button>Send</button></form>\nexport const Toggle = ({ go }) => <button onClick={go} />',
    [4],
  ],
  [
    'a static branch of a condition',
    "'use client'\nexport const A = ({ open }) => <div>{open && <section><h3>Help</h3><p>Text</p></section>}</div>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'reads of an import and a static module constant',
    "'use client'\nimport { copy } from './copy'\nconst FIELD = 'name'\nexport const A = ({ go }) => <form onSubmit={go}><div><label htmlFor={FIELD}>{copy.labels[FIELD]}</label><input id={`${FIELD}-input`} name={FIELD} /></div></form>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'a module constant copy dictionary',
    "'use client'\nconst COPY = { title: 'Title', body: 'Body' }\nexport const A = () => <div><h2>{COPY.title}</h2><p>{COPY.body}</p></div>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'an imported asset on an intrinsic element',
    "'use client'\nimport logo from './logo.svg'\nexport const A = () => <div><img src={logo} alt=\"\" /><h2>Title</h2></div>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'the static part of a fragment, without counting the fragment',
    "'use client'\nexport const A = ({ go }) => <><button onClick={go} /><ul><li>One</li><li>Two</li></ul></>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'a flat run of static siblings under a handler',
    "'use client'\nexport const A = ({ go }) => <div onClick={go}><h1>T</h1><p>A</p><p>B</p><p>C</p></div>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [4],
  ],
  [
    'a static fragment of four',
    "'use client'\nexport const A = () => <><h1>T</h1><p>A</p><p>B</p><p>C</p></>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [4],
  ],
  [
    'one level into a namespace import',
    "'use client'\nimport * as UI from 'ui'\nexport const A = () => <UI.Card><h2>Title</h2><p>Body</p></UI.Card>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
  [
    'an imported component with literal props',
    "'use client'\nimport { Card } from './card'\nexport const A = () => <Card title=\"x\"><h2>Title</h2><p>Body</p></Card>\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [3],
  ],
]
const TYPESCRIPT_REPORTS: [string, string, number[]][] = [
  [
    'a component checked with satisfies',
    "'use client'\nexport const Card = (() => <div><section><h2>Title</h2><p>Body</p></section></div>) satisfies FC\nexport const Toggle = ({ go }) => <button onClick={go} />",
    [4],
  ],
]
describe.each(SETUPS)('no-static-jsx-in-client under %s', (_setup, setup) => {
  it.each(PASSES)('passes %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(MORE_PASSES)('passes %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(REPORTS)('reports %s', (_case, code, counts) => {
    expect(lint(setup, code)).toEqual(counts)
  })
  it('takes the threshold from minElements', () => {
    expect(
      lint(setup, "'use client'\nexport const A = () => <div><h2>Title</h2><p>Body</p></div>", 4),
    ).toEqual([])
    expect(
      lint(
        setup,
        "'use client'\nexport const A = () => <h1>Hi</h1>\nexport const Toggle = ({ go }) => <button onClick={go} />",
        1,
      ),
    ).toEqual([1])
  })
})
describe.each(SETUPS.slice(1))(
  'no-static-jsx-in-client on TypeScript syntax under %s',
  (_setup, setup) => {
    it.each(TYPESCRIPT_REPORTS)('reports %s', (_case, code, counts) => {
      expect(lint(setup, code)).toEqual(counts)
    })
  },
)
