---
'@soujvnunes/react': minor
---

`createApi` redesigned to match the house §26 pattern: **throw-free**, always returns an `ApiResponse<T>` envelope (now handles `!response.ok` as well as network/parse errors), and ships the `createApiResponseSuccess` / `createApiResponseError` envelope builders — the `onError` callback is gone. `motion` references React types via the ambient `React.*` namespace instead of a named `react` type import.
