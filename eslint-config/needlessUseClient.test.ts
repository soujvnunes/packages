import { describe, expect, it } from 'vitest'
import { lintWithRule } from './lintWithRule'
import { ruleSetups } from './ruleSetups'
const lint = (languageOptions: Parameters<typeof lintWithRule>[0], code: string) =>
  lintWithRule(languageOptions, code, { 'soujvnunes/no-needless-use-client': 'error' }).map(
    ({ fatal, message, messageId }) => (fatal ? message : messageId),
  )
const KEEPS: [string, string][] = [
  ['a module with no directive', 'export const Hero = () => <h1>Hi</h1>'],
  [
    'a hook call',
    "'use client'\nimport { useState } from 'react'\nexport const A = () => { const [a] = useState(0); return <p>{a}</p> }",
  ],
  [
    'a hook read through a namespace',
    "'use client'\nexport const A = () => { Ctx.State.useHook(); return null }",
  ],
  ['use()', "'use client'\nexport const A = ({ promise }) => <p>{use(promise)}</p>"],
  ['an event handler', "'use client'\nexport const A = ({ go }) => <button onClick={go}>Go</button>"],
  [
    'an inline function prop',
    "'use client'\nimport { Chart } from './ui'\nexport const A = () => <Chart format={(value) => `${value}%`} />",
  ],
  [
    'a local function prop',
    "'use client'\nimport { Chart } from './ui'\nconst format = (value) => value\nexport const A = () => <Chart format={format} />",
  ],
  [
    'a function declaration prop',
    "'use client'\nimport { Chart } from './ui'\nfunction format(value) { return value }\nexport const A = () => <Chart format={format} />",
  ],
  [
    'a render-prop child',
    "'use client'\nimport { List } from './ui'\nexport const A = () => <List>{(item) => <li>{item}</li>}</List>",
  ],
  [
    'an imported function prop',
    "'use client'\nimport { NumberFlow } from './ui'\nimport { formatPrice } from './format'\nexport const Price = ({ value }) => <NumberFlow format={formatPrice} value={value} />",
  ],
  [
    'a function inside an object prop',
    "'use client'\nimport { Chart } from './ui'\nexport const Stats = ({ data }) => <Chart data={data} options={{ tooltip: { format: (v) => `${v}%` } }} />",
  ],
  [
    'a class instance prop',
    "'use client'\nimport { QueryClientProvider } from './ui'\nconst client = new QueryClient()\nexport const Providers = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>",
  ],
  [
    'a spread of an import',
    "'use client'\nimport { Chart } from './ui'\nimport config from './config'\nexport const A = () => <Chart {...config} />",
  ],
  [
    'a dot into a named import',
    "'use client'\nimport { ThemeCtx } from './ctx'\nexport const ThemeProvider = ({ children }) => <ThemeCtx.Provider value=\"dark\">{children}</ThemeCtx.Provider>",
  ],
  [
    'motion.div',
    "'use client'\nimport { motion } from 'motion/react'\nexport const Fade = ({ children }) => <motion.div initial={{ opacity: 0 }}>{children}</motion.div>",
  ],
  [
    'two dots into a namespace import',
    "'use client'\nimport * as UI from 'ui'\nexport const A = () => <UI.Menu.Item />",
  ],
  [
    'an exported value that carries functions',
    "'use client'\nexport const columns = [{ accessorKey: 'amount', header: () => <div>Amount</div> }]",
  ],
  [
    'an exported function that is not a component',
    "'use client'\nexport const formatPrice = (value) => value",
  ],
  [
    'an exported class',
    "'use client'\nexport class Boundary extends Component { render() { return null } }",
  ],
  [
    'a class component kept to the module',
    "'use client'\nclass Boundary extends React.PureComponent { render() { return null } }\nexport const A = () => <Boundary />",
  ],
  ['createContext', "'use client'\nconst Ctx = createContext(null)\nexport const A = () => null"],
  [
    'next/dynamic through its default import',
    "'use client'\nimport load from 'next/dynamic'\nconst Map = load(() => import('./map'), { ssr: false })\nexport const A = () => <Map />",
  ],
  [
    'next/dynamic through a named default',
    "'use client'\nimport { default as load } from 'next/dynamic'\nconst Map = load(() => import('./map'), { ssr: false })\nexport const A = () => <Map />",
  ],
  [
    'a value re-export, the way to put a boundary around a dependency that ships none',
    "'use client'\nexport { Carousel } from 'carousel'",
  ],
  ['an export-all re-export', "'use client'\nexport * from 'carousel'"],
  [
    'an import exported again',
    "'use client'\nimport { Carousel } from 'carousel'\nexport { Carousel }",
  ],
  ['window', "'use client'\nexport const Width = () => <p>{window.innerWidth}</p>"],
  ['location', "'use client'\nexport const Path = () => <p>{location.pathname}</p>"],
  ['localStorage', "'use client'\nexport const Saved = () => <p>{localStorage.getItem('k')}</p>"],
  [
    'a defaulted function prop',
    "'use client'\nimport { Chart } from 'chart'\nexport const Stats = ({ format = (v) => `${v}%` }) => <Chart format={format} />",
  ],
  [
    'a defaulted imported prop',
    "'use client'\nimport { Button } from './ui'\nimport { ChevronIcon } from './icons'\nexport const A = ({ icon = ChevronIcon }) => <Button icon={icon} />",
  ],
  [
    'a callback argument that holds an imported function',
    "'use client'\nimport { Cell } from './ui'\nimport { formatPrice } from './format'\nconst COLUMNS = [{ key: 'price', format: formatPrice }]\nexport const A = () => <ul>{COLUMNS.map((column) => <Cell key={column.key} format={column.format} />)}</ul>",
  ],
  [
    'a function child behind a member',
    "'use client'\nimport { List } from './ui'\nconst renderers = { row: (item) => <li>{item}</li> }\nexport const A = () => <List>{renderers.row}</List>",
  ],
  [
    'a function child behind &&',
    "'use client'\nimport { List } from './ui'\nconst renderRow = (item) => <li>{item}</li>\nexport const A = ({ open }) => <List>{open && renderRow}</List>",
  ],
  [
    'an imported function child behind ?:',
    "'use client'\nimport { List } from './ui'\nimport { renderRow } from './rows'\nexport const A = ({ open }) => <List>{open ? renderRow : null}</List>",
  ],
  [
    'a context rendered as its own provider',
    "'use client'\nimport { SessionContext } from './session-context'\nexport const SessionProvider = ({ session, children }) => <SessionContext value={session}>{children}</SessionContext>",
  ],
  ['client-only', "'use client'\nimport 'client-only'\nexport const A = () => <p>Hi</p>"],
  [
    'a module-level side effect',
    "'use client'\nimport { gsap } from 'gsap'\ngsap.registerPlugin()\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a default-exported helper',
    "'use client'\nexport default function formatPrice(value) { return value }",
  ],
  ['an anonymous default-exported function', "'use client'\nexport default (value) => value"],
  [
    'a browser global read through globalThis',
    "'use client'\nexport const Saved = () => <p>{globalThis.localStorage.getItem('k')}</p>",
  ],
  [
    'a callback ref on a tag',
    "'use client'\nexport const A = () => <input ref={(node) => node?.focus()} />",
  ],
  [
    'an imported form action',
    "'use client'\nimport { save } from './save'\nexport const A = () => <form action={save} />",
  ],
  [
    'a namespace member handed to a component',
    "'use client'\nimport { Chart } from './ui'\nimport * as fmt from './format'\nexport const A = () => <Chart format={fmt.price} />",
  ],
  [
    'a read through a named import handed to a component',
    "'use client'\nimport { Input } from './ui'\nimport { copy } from './copy'\nexport const A = () => <Input placeholder={copy.email} />",
  ],
  [
    'an alias of motion.div',
    "'use client'\nimport { motion } from 'motion/react'\nconst MotionDiv = motion.div\nexport const Fade = ({ children }) => <MotionDiv>{children}</MotionDiv>",
  ],
  [
    'a styled-components tag',
    "'use client'\nimport styled from 'styled-components'\nconst Title = styled.h1`color: red;`\nexport const Hero = () => <Title>Hi</Title>",
  ],
  [
    'a tag destructured from a namespace object',
    "'use client'\nimport { Menu } from './ui'\nconst { Item } = Menu\nexport const A = () => <Item>Hi</Item>",
  ],
  [
    'a component a higher-order function returns',
    "'use client'\nimport { withTheme } from './theme'\nimport { Base } from './ui'\nconst Fancy = withTheme(Base)\nexport const A = () => <Fancy />",
  ],
  ['a side-effect import', "'use client'\nimport './init-sentry'\nexport const Init = () => null"],
  [
    'a call in a module-level initializer',
    "'use client'\nimport { init } from './analytics'\nconst analytics = init('key')\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a module-level if',
    "'use client'\nimport { gsap, ScrollTrigger } from 'gsap'\nif (gsap) gsap.registerPlugin(ScrollTrigger)\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a let that is assigned a function later',
    "'use client'\nimport { NumberFlow } from './ui'\nlet format = 'currency'\nexport const A = ({ percent }) => { if (percent) format = (v) => v; return <NumberFlow format={format} /> }",
  ],
  [
    'a RegExp prop',
    "'use client'\nimport { IMaskInput } from './ui'\nexport const A = () => <IMaskInput mask={/^\\d{5}$/} />",
  ],
  [
    'a method read off a data constant',
    "'use client'\nimport { Field } from './ui'\nconst LABEL = 'name'\nexport const A = () => <Field transform={LABEL.toUpperCase} />",
  ],
  [
    'a function default in a destructured local',
    "'use client'\nimport { Chart } from './ui'\nexport const A = (props) => { const { format = (v) => `${v}%`, data } = props; return <Chart format={format} data={data} /> }",
  ],
  [
    'a function default in a module-level pattern',
    "'use client'\nimport { Chart } from './ui'\nconst { format = (v) => v } = {}\nexport const A = () => <Chart format={format} />",
  ],
  [
    'a received tag defaulting to motion.div',
    "'use client'\nimport { motion } from 'motion/react'\nexport const Box = ({ as: Tag = motion.div, children }) => <Tag>{children}</Tag>",
  ],
  [
    'a received tag defaulting to a higher-order result',
    "'use client'\nimport { withTheme } from './theme'\nimport { Base } from './ui'\nexport const Box = ({ as: Tag = withTheme(Base) }) => <Tag />",
  ],
  [
    'a let object reassigned to hold a function',
    "'use client'\nimport { Chart } from './ui'\nlet OPTIONS = { format: 'currency' }\nexport const A = ({ percent }) => { if (percent) OPTIONS = { format: (v) => v }; return <Chart format={OPTIONS.format} /> }",
  ],
  [
    'a const object written through a member',
    "'use client'\nimport { Chart } from './ui'\nconst OPTIONS = { format: 'currency' }\nexport const A = ({ percent }) => { if (percent) OPTIONS.format = (v) => v; return <Chart format={OPTIONS.format} /> }",
  ],
  [
    'a key a later spread may replace',
    "'use client'\nimport { Chart } from './ui'\nimport { overrides } from './overrides'\nconst OPTIONS = { format: 'currency', ...overrides }\nexport const A = () => <Chart format={OPTIONS.format} />",
  ],
  [
    'a key a later computed key may replace',
    "'use client'\nimport { fmt } from './fmt'\nimport { Chart } from './ui'\nconst K = 'format'\nconst OPTIONS = { format: 'currency', [K]: fmt }\nexport const A = () => <Chart format={OPTIONS.format} />",
  ],
  [
    'a call in a module-level pattern default',
    "'use client'\nimport { init } from './analytics'\nconst { client = init('key') } = {}\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a call inside module-level markup',
    "'use client'\nimport { init } from './analytics'\nconst BANNER = <p>{init('key')}</p>\nexport const A = () => BANNER",
  ],
  [
    'an empty re-export, which still imports the module',
    "'use client'\nexport {} from './init-sentry'\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a context imported under an alias',
    '\'use client\'\nimport { ThemeContext as Theme } from \'./theme\'\nexport const A = ({ children }) => <Theme value="dark" mode="x">{children}</Theme>',
  ],
  [
    'a context named with Ctx',
    '\'use client\'\nimport { ThemeCtx } from \'./theme\'\nexport const A = ({ children }) => <ThemeCtx value="dark" mode="x">{children}</ThemeCtx>',
  ],
  [
    'a lone value attribute, the provider shape',
    "'use client'\nimport { Store } from './store'\nexport const A = ({ children }) => <Store value={1}>{children}</Store>",
  ],
  [
    'createPortal',
    "'use client'\nimport { createPortal } from 'react-dom'\nexport const Modal = ({ children, container }) => createPortal(children, container)",
  ],
  [
    'a hook imported under an alias',
    "'use client'\nimport { useState as state } from 'react'\nexport const A = () => { const [value] = state(0); return <p>{value}</p> }",
  ],
  [
    'a method read off a constant built from another',
    "'use client'\nimport { Field } from './ui'\nconst LABELS = { name: 'Name' }\nconst LABEL = LABELS.name\nexport const A = () => <Field transform={LABEL.toUpperCase} />",
  ],
  [
    'an array method read off a nested constant',
    "'use client'\nimport { Table } from './ui'\nconst DATA = { rows: [] }\nexport const A = () => <Table render={DATA.rows.map} />",
  ],
  [
    'a received tag defaulting to itself, without overflowing the stack',
    "'use client'\nexport const Box = ({ as: Tag = Tag }) => <Tag />",
  ],
  [
    'two received tags defaulting to each other',
    "'use client'\nexport const Box = ({ as: Tag = Other, other: Other = Tag }) => <Tag />",
  ],
  [
    'a call in a computed key partway along a module-level read',
    "'use client'\nimport { detect } from './detect'\nconst DICT = { pt: { title: 'Título' } }\nconst TITLE = DICT[detect()].title\nexport const A = () => <p>{TITLE}</p>",
  ],
  [
    'a call in the callee of a module-level cva',
    "'use client'\nimport { setup } from './setup'\nconst button = setup().cva({ base: 'x' })\nexport const A = () => <button className={button()} />",
  ],
  [
    'a mutated object handed over whole',
    "'use client'\nimport { Chart } from './ui'\nconst OPTIONS = { format: 'currency' }\nexport const A = ({ percent }) => { if (percent) OPTIONS.format = (v) => v; return <Chart options={OPTIONS} /> }",
  ],
  [
    'an object Object.assign writes',
    "'use client'\nimport { Chart } from './ui'\nconst OPTIONS = { format: 'currency' }\nexport const A = () => { Object.assign(OPTIONS, { format: (v) => v }); return <Chart {...OPTIONS} /> }",
  ],
  [
    'a default on an enclosing pattern',
    "'use client'\nimport { Chart } from './ui'\nexport const A = ({ options: { format } = { format: (v) => v } }) => <Chart format={format} />",
  ],
  [
    'an array a method call writes',
    "'use client'\nimport { Chart } from './ui'\nconst FORMATS = []\nexport const A = () => { FORMATS.push((v) => v); return <Chart format={FORMATS[0]} /> }",
  ],
  [
    'a local hook name bound to a non-hook import',
    "'use client'\nimport { store as useStore } from './store'\nexport const A = () => { const value = useStore(); return <p>{value}</p> }",
  ],
  [
    'flushSync',
    "'use client'\nimport { flushSync } from 'react-dom'\nexport const A = ({ go }) => <p>{flushSync(go)}</p>",
  ],
  [
    'a key deleted from its object',
    "'use client'\nimport { Chart } from './ui'\nconst OPTIONS = { format: 'currency' }\nexport const A = () => { delete OPTIONS.format; return <Chart format={OPTIONS.format} /> }",
  ],
  [
    'a key incremented in place',
    "'use client'\nimport { Chart } from './ui'\nconst COUNTS = { a: 1 }\nexport const A = () => { COUNTS.a++; return <Chart count={COUNTS.a} /> }",
  ],
  [
    'an object handed to a call that may write it',
    "'use client'\nimport { Chart } from './ui'\nimport { patch } from './patch'\nconst OPTIONS = { format: 'currency' }\nexport const A = () => { patch(OPTIONS); return <Chart format={OPTIONS.format} /> }",
  ],
]
const REPORTS: [string, string][] = [
  ['a static component', "'use client'\nexport const Hero = () => <h1>Hi</h1>"],
  [
    'a wrapper that forwards props and classes to a namespace primitive',
    "'use client'\nimport * as LabelPrimitive from '@radix-ui/react-label'\nimport { cn } from './cn'\nexport const Label = ({ className, ...props }) => <LabelPrimitive.Root className={cn('text-sm', className)} {...props} />",
  ],
  [
    'a defaulted prop passed on',
    "'use client'\nimport * as SelectPrimitive from '@radix-ui/react-select'\nexport function SelectContent({ position = 'popper', ...props }) { return <SelectPrimitive.Content position={position} {...props} /> }",
  ],
  [
    'a forwardRef component',
    "'use client'\nexport const Button = forwardRef((props, ref) => <button ref={ref} {...props} />)",
  ],
  [
    'a module constant of data passed as a prop',
    "'use client'\nimport { Tag } from './ui'\nconst label = 'Save'\nexport const A = () => <Tag label={label} />",
  ],
  [
    'object and array literals of data',
    "'use client'\nimport { Chart } from 'chart'\nexport const A = () => <Chart data={[{ x: 1 }]} options={{ title: 'Sales' }} />",
  ],
  [
    'a function that only arrives as a prop, since the importer that created it is the client side',
    "'use client'\nimport { Chart } from './ui'\nexport const A = ({ format }) => <Chart format={format} />",
  ],
  [
    'a local component exported by name',
    "'use client'\nconst Hero = () => <h1>Hi</h1>\nexport { Hero }",
  ],
  [
    'imports read in a tag, where only data can go',
    "'use client'\nimport { copy } from './copy'\nimport logo from './logo.svg'\nexport const Hero = () => <h1 title={copy.title}><img src={logo} alt=\"\" />{copy.heading}</h1>",
  ],
  [
    'a named namespace import from radix-ui',
    "'use client'\nimport { Label as LabelPrimitive } from 'radix-ui'\nimport { cn } from './cn'\nexport const Label = ({ className, ...props }) => <LabelPrimitive.Root className={cn('text-sm', className)} {...props} />",
  ],
  [
    'a default-exported component',
    "'use client'\nexport default function Page() { return <h1>Hi</h1> }",
  ],
  [
    'a stylesheet import',
    "'use client'\nimport './card.css'\nexport const Card = () => <div className=\"card\">Hi</div>",
  ],
  [
    'a module-level cva call',
    "'use client'\nimport { cva } from 'class-variance-authority'\nimport { cn } from './cn'\nconst variants = cva('rounded')\nexport const Badge = ({ className, ...props }) => <span className={cn(variants(), className)} {...props} />",
  ],
  [
    'a module constant read off another',
    "'use client'\nconst SIZES = { sm: 'h-8' }\nconst DEFAULT_SIZE = SIZES.sm\nexport const Box = () => <div className={DEFAULT_SIZE} />",
  ],
  [
    'memo over a component binding',
    "'use client'\nimport { memo } from 'react'\nconst RowBase = ({ id }) => <tr id={id} />\nexport const Row = memo(RowBase)",
  ],
  ['a let with no initializer', "'use client'\nlet counter\nexport const A = () => <p>Hi</p>"],
  [
    'a helper function declaration',
    "'use client'\nfunction helper() { return 1 }\nexport const A = () => <p>{helper()}</p>",
  ],
  [
    'template, unary, binary, conditional and logical constants',
    "'use client'\nconst A1 = `a`\nconst B1 = -1\nconst C1 = 1 + 2\nconst D1 = true ? 'a' : 'b'\nconst E1 = null ?? 'x'\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a computed key in a module constant',
    "'use client'\nconst K = 'a'\nconst M = { [K]: 1 }\nexport const A = () => <p>Hi</p>",
  ],
  [
    'a module-level tv call',
    "'use client'\nimport { tv } from 'tailwind-variants'\nconst button = tv({ base: 'x' })\nexport const A = () => <button className={button()} />",
  ],
  ['module-level markup', "'use client'\nconst ICON = <svg />\nexport const A = () => <p>{ICON}</p>"],
  [
    'a received tag with a tag-name default',
    "'use client'\nexport const Box = ({ as: Tag = 'div', children }) => <Tag>{children}</Tag>",
  ],
  [
    'a key a spread before it cannot replace',
    "'use client'\nimport { Chart } from './ui'\nimport { base } from './base'\nconst OPTIONS = { ...base, format: 'currency' }\nexport const A = () => <Chart format={OPTIONS.format} />",
  ],
  [
    'a received tag defaulting to a namespace member',
    "'use client'\nimport * as UI from './ui'\nexport const Box = ({ as: Tag = UI.Card, children }) => <Tag>{children}</Tag>",
  ],
  [
    'a received tag defaulting to an imported component',
    "'use client'\nimport { Card } from './ui'\nexport const Box = ({ as: Tag = Card, children }) => <Tag>{children}</Tag>",
  ],
  [
    'a dictionary key named like a string method',
    "'use client'\nimport { Input } from './ui'\nconst LABELS = { search: 'Buscar' }\nexport const A = () => <Input placeholder={LABELS.search} />",
  ],
  [
    'a self-closing component with a lone value, which cannot be a provider',
    "'use client'\nimport { Progress } from './ui'\nexport const A = () => <Progress value={50} />",
  ],
]
const TYPESCRIPT_KEEPS: [string, string][] = [
  [
    'a typed handler',
    "'use client'\nexport const A = ({ go }: { go: () => void }) => <button onClick={go} />",
  ],
  [
    'an enum member built by a call',
    "'use client'\nimport { init } from './init'\nenum E { A = init() }\nexport const A = () => <p>Hi</p>",
  ],
]
const TYPESCRIPT_REPORTS: [string, string][] = [
  ['an enum', "'use client'\nenum Size { Small }\nexport const A = () => <p>Hi</p>"],
  [
    'a type-only export-all',
    "'use client'\nexport type * from './types'\nexport const A = () => <p>Hi</p>",
  ],
  [
    'an inline type-only re-export',
    "'use client'\nexport { type Props } from './types'\nexport const Hero = () => <h1>Hi</h1>",
  ],
  [
    'a DOM type named only in a type position',
    "'use client'\nimport { HTMLDivElement } from './ui'\nexport const Card = (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />",
  ],
  [
    'a forwardRef typed with a DOM element',
    "'use client'\nimport { forwardRef } from 'react'\nexport const Input = forwardRef<HTMLInputElement, { id: string }>((props, ref) => <input ref={ref} {...props} />)",
  ],
  [
    'a type-only re-export next to a static component',
    "'use client'\nexport type { Props } from './types'\nexport const Hero = () => <h1>Hi</h1>",
  ],
  [
    'an exported type beside a typed component',
    "'use client'\nexport interface Props { id: string }\nexport const A = ({ id }: Props) => <p id={id} />",
  ],
]
describe.each(ruleSetups)('no-needless-use-client under %s', (_setup, setup) => {
  it.each(KEEPS)('keeps the directive for %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(REPORTS)('reports %s', (_case, code) => {
    expect(lint(setup, code)).toEqual(['needless'])
  })
})
describe.each(ruleSetups.slice(1))(
  'no-needless-use-client on TypeScript syntax under %s',
  (_setup, setup) => {
    it.each(TYPESCRIPT_KEEPS)('keeps the directive for %s', (_case, code) => {
      expect(lint(setup, code)).toEqual([])
    })
    it.each(TYPESCRIPT_REPORTS)('reports %s', (_case, code) => {
      expect(lint(setup, code)).toEqual(['needless'])
    })
  },
)
