import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, it } from 'vitest'
import { needlessUseClient } from './needlessUseClient'
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})
const needless = [{ messageId: 'needless' }]
describe('no-needless-use-client', () => {
  it('ignores a module with no directive, whatever it renders', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: ['export const Hero = () => <h1>Hi</h1>'],
      invalid: [],
    })
  })
  it('keeps the directive for a hook call, bare or through a namespace', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [
        "'use client'\nimport { useState } from 'react'\nexport const A = () => { const [a] = useState(0); return <p>{a}</p> }",
        "'use client'\nexport const A = () => { Ctx.State.useHook(); return null }",
        "'use client'\nexport const A = ({ promise }) => use(promise)",
      ],
      invalid: [],
    })
  })
  it('keeps the directive for an event handler or a function handed to JSX, which a server parent cannot pass', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [
        "'use client'\nexport const A = ({ go }) => <button onClick={go}>Go</button>",
        "'use client'\nexport const A = () => <Chart format={(value) => `${value}%`} />",
        "'use client'\nconst format = (value) => value\nexport const A = () => <Chart format={format} />",
        "'use client'\nfunction format(value) { return value }\nexport const A = () => <Chart format={format} />",
        "'use client'\nexport const A = () => <List>{(item) => <li>{item}</li>}</List>",
      ],
      invalid: [],
    })
  })
  it('keeps the directive for a browser global, declared or not', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [
        "'use client'\nexport const width = () => window.innerWidth",
        {
          code: "'use client'\nexport const save = (value) => localStorage.setItem('k', value)",
          languageOptions: { globals: { localStorage: 'readonly' } },
        },
      ],
      invalid: [],
    })
  })
  it('keeps the directive for a class component, createContext and next/dynamic, none of which run on the server', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [
        "'use client'\nexport class Boundary extends Component { render() { return null } }",
        "'use client'\nexport class Boundary extends React.PureComponent { render() { return null } }",
        "'use client'\nexport const Ctx = createContext(null)",
        "'use client'\nimport load from 'next/dynamic'\nexport const Map = load(() => import('./map'), { ssr: false })",
      ],
      invalid: [],
    })
  })
  it('keeps the directive on a re-export, the way to put a boundary around a dependency that ships none', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [
        "'use client'\nexport { Carousel } from 'carousel'",
        "'use client'\nexport * from 'carousel'",
      ],
      invalid: [],
    })
  })
  it('reports a wrapper that only forwards props and classes to a primitive', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [],
      invalid: [
        {
          code: "'use client'\nimport * as LabelPrimitive from '@radix-ui/react-label'\nimport { cn } from './cn'\nexport const Label = ({ className, ...props }) => <LabelPrimitive.Root className={cn('text-sm', className)} {...props} />",
          errors: needless,
        },
        { code: "'use client'\nexport const Hero = () => <h1>Hi</h1>", errors: needless },
        {
          code: "'use client'\nconst label = 'Save'\nexport const A = () => <Tag label={label} />",
          errors: needless,
        },
      ],
    })
  })
  it('reports a function that only arrives as a prop, since the importer that created it is the client side', () => {
    ruleTester.run('no-needless-use-client', needlessUseClient, {
      valid: [],
      invalid: [
        {
          code: "'use client'\nexport const A = ({ format }) => <Chart format={format} />",
          errors: needless,
        },
      ],
    })
  })
  it('reads the directive the TypeScript parser produces', () => {
    const tsTester = new RuleTester({
      languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    })
    tsTester.run('no-needless-use-client', needlessUseClient, {
      valid: ["'use client'\nexport const A = ({ go }: { go: () => void }) => <button onClick={go} />"],
      invalid: [
        {
          code: "'use client'\nexport const A = ({ id }: { id: string }) => <p id={id} />",
          errors: needless,
        },
      ],
    })
  })
})
