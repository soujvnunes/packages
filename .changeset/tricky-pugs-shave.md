---
'@soujvnunes/util': minor
---

`isConnectionError` now takes `unknown` instead of `Error`, and reads the message through `getErrorMessage`. A `catch` binding goes straight in, with no `instanceof Error` narrowing at the call site. A throw that is not an `Error` has no message to match and returns `false`. Widening the parameter, so existing calls that already pass an `Error` keep working.
