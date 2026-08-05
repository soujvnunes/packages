import { AnimatePresence } from 'motion/react'
import { describe, expect, it } from 'vitest'

import { isEmptyAnimatePresence } from './motion'

describe('isEmptyAnimatePresence', () => {
  it('is false for a presence with no children prop, which is not a shape a layout renders', () => {
    expect(isEmptyAnimatePresence(<AnimatePresence />)).toBe(false)
  })

  it('is true for a presence whose only child is falsy', () => {
    expect(isEmptyAnimatePresence(<AnimatePresence>{null}</AnimatePresence>)).toBe(true)
    expect(isEmptyAnimatePresence(<AnimatePresence>{false}</AnimatePresence>)).toBe(true)
    expect(isEmptyAnimatePresence(<AnimatePresence>{''}</AnimatePresence>)).toBe(true)
  })

  it('is true for a presence whose children are all falsy', () => {
    expect(
      isEmptyAnimatePresence(
        <AnimatePresence>
          {null}
          {false}
          {undefined}
        </AnimatePresence>,
      ),
    ).toBe(true)
  })

  it('is false when at least one child renders', () => {
    expect(
      isEmptyAnimatePresence(
        <AnimatePresence>
          {null}
          <span key="a">a</span>
        </AnimatePresence>,
      ),
    ).toBe(false)
  })

  it('is false for a presence with a single rendered child', () => {
    expect(
      isEmptyAnimatePresence(
        <AnimatePresence>
          <span>a</span>
        </AnimatePresence>,
      ),
    ).toBe(false)
  })

  it('is false for an element that is not an AnimatePresence', () => {
    expect(isEmptyAnimatePresence(<div />)).toBe(false)
    expect(isEmptyAnimatePresence(<div>{null}</div>)).toBe(false)
  })

  it('is false for a node that is not an element', () => {
    expect(isEmptyAnimatePresence(null)).toBe(false)
    expect(isEmptyAnimatePresence(undefined)).toBe(false)
    expect(isEmptyAnimatePresence('text')).toBe(false)
    expect(isEmptyAnimatePresence(0)).toBe(false)
  })
})
