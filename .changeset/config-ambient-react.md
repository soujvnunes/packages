---
'@soujvnunes/eslint-config': minor
'@soujvnunes/prettier-config': minor
---

Enforce the ambient-React convention. ESLint now bans importing the React default (`import React`), the React namespace (`import * as React`), and named React **type** imports — reference types via the ambient `React.*` namespace instead. Prettier collapses object literals onto a single line when they fit (`objectWrap: 'collapse'`), for smaller files.
