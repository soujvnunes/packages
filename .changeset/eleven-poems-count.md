---
'@soujvnunes/util': patch
---

`formatTimestamp` renders midnight as `00`, not `24`. It asked for `hour12: false`, which resolves to the h24 hour cycle in en-US and turned `00:05` into `24:05`. It now asks for `hourCycle: 'h23'`. Locales that already defaulted to h23, such as pt-BR and en-GB, are unaffected.
