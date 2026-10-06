---
'@soujvnunes/lib': patch
---

The published type files no longer carry doc comments, so `createMongooseConnection`, `withDb`, `withDbCallback`, `BaseModel` and `BaseTimestampedModel` show no doc text on hover. Nothing else changed: the compiled output with comments removed is the same as before. The README now states the connect options `createMongooseConnection` defaults, when to use `withDb` and when `withDbCallback`, and what the two base classes type and add.
