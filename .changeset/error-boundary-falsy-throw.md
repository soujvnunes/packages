---
'@soujvnunes/react': patch
---

`ErrorBoundary` now catches a thrown value that is not an `Error`. A falsy one (`throw null`, `throw ''`) used to land in state as a falsy error, so the boundary rendered its children again, the child threw again and the error escaped with no Fallback and no `onError` call. Any non-`Error` value is now wrapped in `new Error(String(value))`, so the Fallback and `onError` always receive the `Error` their types declare; an `Error`, and Next's `digest` on it, passes through unchanged.
