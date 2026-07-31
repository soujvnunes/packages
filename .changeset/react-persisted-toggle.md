---
'@soujvnunes/react': minor
---

Add `createPersistedToggle({ name, cookie, values, maxAge? })` — a server-seeded, cookie-persisted UI-state factory (nextjs-conventions §21 split State/Dispatch + §5 cookie seed). Returns `{ State, Dispatch, Provider, isValue }`: the client `Provider` seeds from a server-read cookie and its dispatch writes the cookie back + calls `router.refresh()` so the server re-renders from it; omitting the dispatch argument cycles through `values` (the toggle); `isValue` narrows a raw cookie string for the server seed-leaf. It owns only the persisted axis — a feature layers transient state, shortcuts, or route-change resets on top. Adds `next` as an optional peer (uses `next/navigation`).

Also refines `createHookedContext`: its returned `Context` is now typed `React.Context<State>` (the internal `UNPROVIDED` sentinel no longer leaks into the public type) — runtime-identical, and it lets factories like `createPersistedToggle` compose it without a `.d.ts` emit error.
