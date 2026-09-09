---
'@soujvnunes/eslint-config': patch
---

`one-line-comments` treats a paragraph break inside a block comment the way it already treats a bare `//` between comment lines: two or more prose paragraphs make it a set of comments, reported without a fix, so a module header written as JSDoc is never welded into one line either. In a JSDoc the blank line before a tag block is that format's own layout rather than a second paragraph, so a description followed by `@param` still collapses. A `/*!` banner and a JSX comment are unaffected, since neither has a `//` form to move a paragraph into, and a break at either edge of the block is a stray that still collapses away. The verdict now lives in the one function that decides a block's legal one-line spelling, so it can no longer bypass the JSDoc, banner and JSX branches.
