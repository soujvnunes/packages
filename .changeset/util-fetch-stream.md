---
'@soujvnunes/util': minor
---

Add `./createApi` (throw-free fetch factory + `ApiResponse` envelope builders) and `./readNdjson` (ndjson stream reader) — moved here from `@soujvnunes/react`, since neither touches React. Zero npm dependencies (they use the platform `fetch` / `ReadableStream`).
