---
'@soujvnunes/lib': patch
---

`createMongooseConnection` declares its return type as the exported `MongooseConnection` interface, so the docs on `withDb` and `withDbCallback` now reach the published types and show on hover. The inferred return type it replaces carried no docs at all.
