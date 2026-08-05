import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { createHookedContext } from './createHookedContext'

afterEach(cleanup)

describe('createHookedContext', () => {
  it('reads the value provided above', () => {
    const Ring = createHookedContext<string>('Ring')
    const Reader = () => <span>{Ring.useHook()}</span>

    render(
      <Ring.Context value="gold">
        <Reader />
      </Ring.Context>,
    )

    expect(screen.getByText('gold')).toBeDefined()
  })

  it('throws with a message naming the context when there is no provider above', () => {
    const Ring = createHookedContext<string>('Ring')
    const Reader = () => <span>{Ring.useHook()}</span>

    expect(() => render(<Reader />)).toThrow('useRing must be used within RingContext')
  })

  it('treats a null state as a real value, not as a missing provider', () => {
    const Failure = createHookedContext<string | null>('Failure')
    const Reader = () => <span>{Failure.useHook() ?? 'no failure yet'}</span>

    render(
      <Failure.Context value={null}>
        <Reader />
      </Failure.Context>,
    )

    expect(screen.getByText('no failure yet')).toBeDefined()
  })

  it('treats an undefined state as a real value too', () => {
    const Draft = createHookedContext<string | undefined>('Draft')
    const Reader = () => <span>{Draft.useHook() ?? 'empty'}</span>

    render(
      <Draft.Context value={undefined}>
        <Reader />
      </Draft.Context>,
    )

    expect(screen.getByText('empty')).toBeDefined()
  })

  it('reads the nearest provider when they nest', () => {
    const Ring = createHookedContext<string>('Ring')
    const Reader = () => <span>{Ring.useHook()}</span>

    render(
      <Ring.Context value="outer">
        <Ring.Context value="inner">
          <Reader />
        </Ring.Context>
      </Ring.Context>,
    )

    expect(screen.getByText('inner')).toBeDefined()
  })

  it('keeps two contexts from the same factory independent', () => {
    const A = createHookedContext<string>('A')
    const B = createHookedContext<string>('B')
    const Reader = () => (
      <span>
        {A.useHook()}-{B.useHook()}
      </span>
    )

    render(
      <A.Context value="a">
        <B.Context value="b">
          <Reader />
        </B.Context>
      </A.Context>,
    )

    expect(screen.getByText('a-b')).toBeDefined()
  })
})
