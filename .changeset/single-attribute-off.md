---
'@soujvnunes/prettier-config': minor
---

`singleAttributePerLine` is now off, which is Prettier's default. On, it put every HTML, Vue or JSX element with two or more attributes on one line per attribute whatever the width, so `<div id="x" className="y">` took three lines at 26 characters, and a consumer's `.html` and `.vue` files reflow with the same `prettier --write`. Measured on a real consumer's tracked `.tsx` files, formatted once each way: 15,216 lines with it on, 13,633 with it off, 1,583 lines or about 10% of the JSX layer. An element that does not fit the 104 width still breaks one attribute per line, as before.

Adopting it is one `prettier --write` over the repo, landed as its own change so the reflow does not bury an unrelated diff.
