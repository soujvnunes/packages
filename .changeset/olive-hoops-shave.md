---
'@soujvnunes/util': patch
---

`matchesQuery` reads the query through a `Map` instead of a computed property access. A schema key that names an inherited member, such as `constructor` or `toString`, now sees the param as absent rather than reading the prototype member off the object.
