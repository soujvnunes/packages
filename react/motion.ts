'use client'

import { isValidElement } from 'react'

import { AnimatePresence } from 'motion/react'

const isPropsWithChildren = (props: unknown): props is { children: React.ReactNode } =>
  props !== null && typeof props === 'object' && 'children' in props

// True when a node is an `<AnimatePresence>` with no rendered children — every child is falsy (null/undefined/false/''). Lets a layout skip wrapper markup that would otherwise reserve space around an empty presence.
export const isEmptyAnimatePresence = (item: React.ReactNode) => {
  if (!isValidElement(item) || item.type !== AnimatePresence) return false

  if (!isPropsWithChildren(item.props)) return false // Unexpected shape — treat as non-empty

  if (!item.props.children) return true // No children at all

  if (Array.isArray(item.props.children)) return item.props.children.every((child) => !child) // All falsy

  return !item.props.children // Single child that is falsy
}
