---
'@soujvnunes/react': patch
---

`ErrorBoundary` now catches any thrown value other than Next's navigation errors, and hands the Fallback and `onError` the same `Error`. A falsy throw (`throw null`, `throw ''`) used to land in state as a falsy error, so the boundary rendered its children again and the error escaped with no Fallback and no `onError` call. A value that is not an `Error` is now wrapped in one: its message is the value's string `message` when it has one (an API error object), otherwise the value as a string, or `A non-Error value was thrown` when it cannot become one, and the original is on `cause`. An `Error` passes through as the same object, one from another realm included, so Next's `digest` still reaches the Fallback.

The boundary also rethrows the errors Next's `redirect()`, `notFound()`, `forbidden()` and `unauthorized()` throw, so they reach Next's own boundary and navigate instead of rendering the Fallback.
