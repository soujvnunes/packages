import { defineConfig } from 'vitest/config'
// One project per package, rooted at the package, so each flat layout and its tsconfig `include` keep working untouched.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'util',
          root: './util',
          environment: 'node',
          include: ['*.test.ts'],
          // formatTimestamp renders in the runtime timezone. Pin it so the assertions are exact.
          env: { TZ: 'UTC' },
        },
      },
      { test: { name: 'lib', root: './lib', environment: 'node', include: ['*.test.ts'] } },
      { test: { name: 'react', root: './react', environment: 'jsdom', include: ['*.test.tsx'] } },
      { test: { name: 'nextjs', root: './nextjs', environment: 'jsdom', include: ['*.test.tsx'] } },
      { test: { name: 'configs', root: './', environment: 'node', include: ['*-config/*.test.ts'] } },
    ],
  },
})
