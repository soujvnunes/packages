---
'@soujvnunes/react': minor
---

**Breaking.** Removed `./createPersistedToggle` and the `next` peer dependency. It moved to `@soujvnunes/nextjs/createPersistedToggle`, since it was the only export in this package that needed Next.js, and the peer dependency bled onto every consumer regardless of which export they used.
