import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'util',
          root: './util',
          environment: 'node',
          include: ['*.test.ts'],
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
