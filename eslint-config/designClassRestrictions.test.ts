import { describe, expect, it } from 'vitest'
import { designClassRestrictions } from './designClassRestrictions'
const ENTRY_COUNT = 7
const restrictionAt = (index: number, dark = false) => {
  const restriction = designClassRestrictions({ dark })[index]
  if (!restriction) throw new Error(`The design restrictions hold no entry at ${index}.`)
  return restriction
}
const flags = (index: number, className: string) =>
  className.match(restrictionAt(index).pattern) !== null
describe('designClassRestrictions', () => {
  it('holds seven entries, each with a message', () => {
    const restrictions = designClassRestrictions({ dark: false })
    expect(restrictions).toHaveLength(ENTRY_COUNT)
    for (const restriction of restrictions) expect(restriction.message).not.toBe('')
  })
  it('drops the dark entry and keeps the other six when dark is allowed', () => {
    const restrictions = designClassRestrictions({ dark: true })
    expect(restrictions).toHaveLength(ENTRY_COUNT - 1)
    expect(restrictions.some((entry) => 'dark:bg-surface'.match(entry.pattern))).toBe(false)
  })
  describe('responsive variants other than lg', () => {
    it.each(['sm:flex', 'md:flex', 'max-sm:hidden', 'max-md:hidden', 'hover:md:flex', 'lg:sm:flex'])(
      'flags %s',
      (className) => expect(flags(0, className)).toBe(true),
    )
    it.each(['flex', 'lg:flex', 'hover:lg:flex', 'max-lg:flex', 'text-small', 'group-hover:flex'])(
      'passes %s',
      (className) => expect(flags(0, className)).toBe(false),
    )
  })
  describe('the dark variant', () => {
    it.each(['dark:bg-surface', 'hover:dark:bg-surface', 'lg:dark:bg-surface'])(
      'flags %s',
      (className) => expect(flags(1, className)).toBe(true),
    )
    it.each(['bg-surface', 'lg:bg-surface', 'hover:bg-surface'])('passes %s', (className) =>
      expect(flags(1, className)).toBe(false),
    )
  })
  describe('motion without motion-safe', () => {
    it.each([
      'transition',
      'transition-colors',
      'animate-spin',
      'duration-300',
      'ease-in',
      'delay-150',
      'hover:transition',
      'lg:duration-300',
      'transition!',
    ])('flags %s', (className) => expect(flags(2, className)).toBe(true))
    it.each([
      'motion-safe:transition',
      'motion-safe:transition-colors',
      'motion-safe:animate-spin',
      'motion-safe:duration-300',
      'motion-safe:lg:ease-in',
      'hover:motion-safe:delay-150',
      'transition-none',
      'animate-none',
      'lg:transition-none',
      'translate-x-4',
    ])('passes %s', (className) => expect(flags(2, className)).toBe(false))
  })
  describe('stock font sizes', () => {
    it.each([
      'text-xs',
      'text-sm',
      'text-base',
      'text-lg',
      'text-xl',
      'text-2xl',
      'text-9xl',
      'lg:text-sm',
      'hover:lg:text-xl',
      'text-sm/6',
    ])('flags %s', (className) => expect(flags(3, className)).toBe(true))
    it.each([
      'text-body',
      'text-heading',
      'lg:text-body',
      'text-foreground',
      'text-10xl',
      'context-sm',
    ])('passes %s', (className) => expect(flags(3, className)).toBe(false))
  })
  describe('values off the scale', () => {
    it.each([
      'p-2',
      'px-10',
      'mt-0.5',
      'gap-x-2',
      'space-y-6',
      'inset-1',
      'top-3',
      'start-5',
      'w-px',
      'h-48',
      'size-32',
      'min-w-1',
      'max-h-96',
      'basis-3',
      '-mt-10',
      '-inset-x-2',
      'lg:p-2',
      'hover:lg:-ml-20',
      'p-2!',
    ])('flags %s', (className) => expect(flags(4, className)).toBe(true))
    it.each([
      'p-0',
      'p-4',
      'px-8',
      'mt-12',
      'gap-16',
      'gap-y-24',
      'space-x-40',
      'inset-64',
      'right-104',
      'w-168',
      'h-4',
      'size-8',
      'min-w-0',
      'min-h-16',
      'max-h-24',
      'basis-4',
      '-mt-8',
      'lg:p-4',
      'motion-safe:lg:-ml-12',
      'w-1/2',
      'w-full',
      'h-auto',
      'size-fit',
      'mx-auto',
      'col-end-3',
      'row-start-2',
      'flex-1',
    ])('passes %s', (className) => expect(flags(4, className)).toBe(false))
  })
  describe('opacity modifiers on a colour', () => {
    it.each([
      'bg-surface/50',
      'text-foreground/70',
      'border-line/20',
      'ring-focus/40',
      'outline-line/10',
      'fill-icon/60',
      'stroke-icon/60',
      'divide-line/20',
      'shadow-shade/30',
      'from-surface/50',
      'via-surface/50',
      'to-surface/50',
      'hover:bg-surface/50',
      'lg:hover:text-foreground/70',
    ])('flags %s', (className) => expect(flags(5, className)).toBe(true))
    it.each([
      'bg-surface',
      'bg-surface-alpha-50',
      'text-foreground',
      'hover:bg-surface',
      'w-1/2',
      'translate-x-1/2',
      'aspect-16/9',
      'bg-linear-to-r/oklch',
      'bg-radial/srgb',
      'text-heading/tight',
    ])('passes %s', (className) => expect(flags(5, className)).toBe(false))
  })
  describe('max-w classes', () => {
    it.each(['max-w-xl', 'max-w-full', 'lg:max-w-prose', 'hover:lg:max-w-screen-md'])(
      'flags %s',
      (className) => expect(flags(6, className)).toBe(true),
    )
    it.each(['w-full', 'min-w-0', 'lg:w-full', 'max-h-24'])('passes %s', (className) =>
      expect(flags(6, className)).toBe(false),
    )
  })
})
