---
'@soujvnunes/eslint-config': minor
---

`one-line-comments` now reserves block comments for JSDoc and JSX. A single-line `/**` sitting directly above or beside the code it documents is JSDoc and ends the run above it, so a `//` on the line before a JSDoc is legal. A plain `/* … */` outside JSX is an error, rewritten as `//` when nothing follows it on its line; a `/**` with another comment or nothing under it is an error without a fix, so its tags are never dropped. A run of comment lines that holds a bare `//` is a paragraph set: it reports without a fix and names the two remedies, one line per fact beside the code it describes, or moving the rationale out of the source. A multi-line `/* … */` that is neither JSDoc nor JSX now collapses to `//`. Directive blocks such as `/* eslint-disable */`, `/* global */` and `/*! … */` banners stay exempt.
