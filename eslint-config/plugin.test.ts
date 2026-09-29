import { describe, expect, it } from 'vitest'
import { soujvnunesPlugin } from './plugin'
describe('soujvnunesPlugin', () => {
  it('carries a name and no version, since ESLint folds a version into its cache key and a hardcoded one drifts from package.json and serves stale --cache results', () => {
    expect(soujvnunesPlugin.meta).toEqual({ name: '@soujvnunes/eslint-config' })
  })
})
