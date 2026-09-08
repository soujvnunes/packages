---
'@soujvnunes/eslint-config': patch
---

`one-line-comments` treats an empty line inside a multi-line block comment the way it treats a bare `//` between comment lines: the comment is a paragraph set, reported without a fix, so a module header written as JSDoc is never welded into one line either. An empty line at either edge of the block is a stray and still collapses away.
