# @soujvnunes/nextjs

Next.js utilities as **subpath exports**, so you import a subpath and install only what it needs.

## `./createPersistedToggle`: server-seeded, cookie-persisted state factory

`createPersistedToggle({ name, cookie, values })` returns `{ State, Dispatch, Provider, isValue }`: a client `Provider` seeded from a server-read cookie whose dispatch writes the cookie back and calls `router.refresh()`, so the server re-renders from it. It gives you split State/Dispatch contexts (built on `@soujvnunes/react/createHookedContext`, an installed dependency). Omitting the dispatch argument cycles `values` (the toggle), and `isValue` narrows a raw cookie for the server seed-leaf.

```bash
pnpm add @soujvnunes/nextjs react next
```

```tsx
import { createPersistedToggle } from '@soujvnunes/nextjs/createPersistedToggle'

export const NavRail = createPersistedToggle({
  name: 'NavRail',
  cookie: 'nav',
  values: ['expanded', 'collapsed'],
})
// server: <NavRail.Provider defaultValue={NavRail.isValue(raw) ? raw : undefined}>{children}</NavRail.Provider>
// client: const state = NavRail.State.useHook(); const set = NavRail.Dispatch.useHook()
```
