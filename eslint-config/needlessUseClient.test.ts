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
const TYPESCRIPT = SETUPS.slice(1)
const lint = (languageOptions: Linter.LanguageOptions, code: string) =>
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
        rules: { 'soujvnunes/no-needless-use-client': 'error' },
      },
      'component.tsx',
    )
    .map(({ fatal, message, messageId }) => (fatal ? message : messageId))
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
    "'use client'\nexport const A = () => <Chart format={(value) => `${value}%`} />",
  ],
  [
    'a local function prop',
    "'use client'\nconst format = (value) => value\nexport const A = () => <Chart format={format} />",
  ],
  [
    'a function declaration prop',
    "'use client'\nfunction format(value) { return value }\nexport const A = () => <Chart format={format} />",
  ],
  [
    'a render-prop child',
    "'use client'\nexport const A = () => <List>{(item) => <li>{item}</li>}</List>",
  ],
  [
    'an imported function prop',
    "'use client'\nimport { formatPrice } from './format'\nexport const Price = ({ value }) => <NumberFlow format={formatPrice} value={value} />",
  ],
  [
    'a function inside an object prop',
    "'use client'\nexport const Stats = ({ data }) => <Chart data={data} options={{ tooltip: { format: (v) => `${v}%` } }} />",
  ],
  [
    'a class instance prop',
    "'use client'\nconst client = new QueryClient()\nexport const Providers = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>",
  ],
  [
    'a spread of an import',
    "'use client'\nimport config from './config'\nexport const A = () => <Chart {...config} />",
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
    "'use client'\nconst label = 'Save'\nexport const A = () => <Tag label={label} />",
  ],
  [
    'object and array literals of data',
    "'use client'\nimport { Chart } from 'chart'\nexport const A = () => <Chart data={[{ x: 1 }]} options={{ title: 'Sales' }} />",
  ],
  [
    'a function that only arrives as a prop, since the importer that created it is the client side',
    "'use client'\nexport const A = ({ format }) => <Chart format={format} />",
  ],
  [
    'a local component exported by name',
    "'use client'\nconst Hero = () => <h1>Hi</h1>\nexport { Hero }",
  ],
  [
    'a default-exported component',
    "'use client'\nexport default function Page() { return <h1>Hi</h1> }",
  ],
]
const TYPESCRIPT_REPORTS: [string, string][] = [
  [
    'a type-only re-export next to a static component',
    "'use client'\nexport type { Props } from './types'\nexport const Hero = () => <h1>Hi</h1>",
  ],
  [
    'an exported type beside a typed component',
    "'use client'\nexport interface Props { id: string }\nexport const A = ({ id }: Props) => <p id={id} />",
  ],
]
describe.each(SETUPS)('no-needless-use-client under %s', (_setup, setup) => {
  it.each(KEEPS)('keeps the directive for %s', (_case, code) => {
    expect(lint(setup, code)).toEqual([])
  })
  it.each(REPORTS)('reports %s', (_case, code) => {
    expect(lint(setup, code)).toEqual(['needless'])
  })
})
describe.each(TYPESCRIPT)('no-needless-use-client on TypeScript syntax under %s', (_setup, setup) => {
  it.each(TYPESCRIPT_REPORTS)('reports %s', (_case, code) => {
    expect(lint(setup, code)).toEqual(['needless'])
  })
  it('keeps the directive for a typed handler', () => {
    expect(
      lint(
        setup,
        "'use client'\nexport const A = ({ go }: { go: () => void }) => <button onClick={go} />",
      ),
    ).toEqual([])
  })
})
