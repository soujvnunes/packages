'use client'
import { isValidElement } from 'react'
import { AnimatePresence } from 'motion/react'
const isPropsWithChildren = (props: unknown): props is { children: React.ReactNode } =>
  props !== null && typeof props === 'object' && 'children' in props
export const isEmptyAnimatePresence = (item: React.ReactNode) => {
  if (!isValidElement(item) || item.type !== AnimatePresence) return false
  if (!isPropsWithChildren(item.props)) return false
  if (!item.props.children) return true
  if (Array.isArray(item.props.children)) return item.props.children.every((child) => !child)
  return !item.props.children
}
