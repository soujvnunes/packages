---
'@soujvnunes/lib': patch
'@soujvnunes/prettier-config': patch
'@soujvnunes/stylelint-config': patch
---

The published type files no longer carry doc comments, so `createMongooseConnection`, `withDb`, `withDbCallback`, `BaseModel`, `BaseTimestampedModel` and each package's `createConfig` show no doc text on hover. Nothing else changed: the compiled output with comments removed is the same as before. The documentation lives in each package's README, which now also states the connect options `createMongooseConnection` defaults, when to use `withDb` and when `withDbCallback`, and what the two base classes type and add.
