---
'@soujvnunes/nextjs': minor
---

Initial release. Adds `createPersistedToggle`, moved from `@soujvnunes/react`: a server-seeded, cookie-persisted UI-state factory built on `@soujvnunes/react/createHookedContext`. It needed `next` as a peer, which no other export in `react` used, so it gets its own package instead of bleeding a Next.js peer dependency onto consumers of `ErrorBoundary`, `createHookedContext`, or `motion`.
