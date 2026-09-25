import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import { staticJsxInClient } from './staticJsxInClient'
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})
const staticMarkup = (count: number) => [{ messageId: 'static', data: { count: String(count) } }]
describe('no-static-jsx-in-client', () => {
  it('ignores static markup in a module with no directive, which a server parent can render', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: ['export const Card = () => <div><h2>Title</h2><p>Body</p></div>'],
      invalid: [],
    })
  })
  it('passes a client file whose markup reads a prop, state or handler at every level', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: [
        "'use client'\nexport const A = ({ title }) => <div><h2>{title}</h2><p className={title}>x</p></div>",
        "'use client'\nexport const A = ({ go }) => <div onClick={go}><h2>Title</h2><p>Body</p></div>",
        "'use client'\nexport const A = (props) => <div {...props}><h2>Title</h2><p>Body</p></div>",
      ],
      invalid: [],
    })
  })
  it('passes a static subtree below the threshold, the size of an icon inside a button', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: [
        "'use client'\nexport const A = ({ go }) => <button onClick={go}><span><Icon /></span></button>",
      ],
      invalid: [],
    })
  })
  it('reports a static card once, at its outermost element, with its element count', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: [],
      invalid: [
        {
          code: "'use client'\nexport const Card = () => <div className=\"card\"><h2>Title</h2><p>Body {'text'}</p></div>",
          errors: staticMarkup(3),
        },
      ],
    })
  })
  it('reports the static part of a dynamic tree, and a static branch of a condition', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: [],
      invalid: [
        {
          code: '\'use client\'\nexport const Form = ({ go }) => <form onSubmit={go}><fieldset><label>Name</label><input name="name" required /></fieldset><button>Send</button></form>',
          errors: staticMarkup(3),
        },
        {
          code: "'use client'\nexport const A = ({ open }) => <div>{open && <section><h3>Help</h3><p>Text</p></section>}</div>",
          errors: staticMarkup(3),
        },
      ],
    })
  })
  it('counts a read of an import or a module constant as static, since the server holds the same value', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: [
        "'use client'\nimport { copy } from './copy'\nexport const A = ({ title }) => <div><h2>{copy.title}</h2><p>{title}</p></div>",
        "'use client'\nlet label = 'Name'\nexport const A = () => <div><label>{label}</label><input name=\"name\" /></div>",
      ],
      invalid: [
        {
          code: "'use client'\nimport { copy } from './copy'\nconst FIELD = 'name'\nexport const A = ({ go }) => <form onSubmit={go}><div><label htmlFor={FIELD}>{copy.labels[FIELD]}</label><input id={`${FIELD}-input`} name={FIELD} /></div></form>",
          errors: staticMarkup(3),
        },
      ],
    })
  })
  it('looks through a fragment without counting it', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: ["'use client'\nexport const A = () => <><h2>Title</h2><p>Body</p></>"],
      invalid: [
        {
          code: "'use client'\nexport const A = ({ go }) => <><button onClick={go} /><ul><li>One</li><li>Two</li></ul></>",
          errors: staticMarkup(3),
        },
      ],
    })
  })
  it('takes the threshold from minElements', () => {
    ruleTester.run('no-static-jsx-in-client', staticJsxInClient, {
      valid: [
        {
          code: "'use client'\nexport const A = () => <div><h2>Title</h2><p>Body</p></div>",
          options: [{ minElements: 4 }],
        },
      ],
      invalid: [
        {
          code: "'use client'\nexport const A = () => <h1>Hi</h1>",
          options: [{ minElements: 1 }],
          errors: staticMarkup(1),
        },
      ],
    })
  })
})
