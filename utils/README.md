# @soujvnunes/utils

Zero-dependency TypeScript utilities. Each is a subpath export, so you import exactly what you use.

## Install

```bash
pnpm add @soujvnunes/utils
```

## Use

```ts
import { ellipses } from '@soujvnunes/utils/ellipses'
import { objectHas } from '@soujvnunes/utils/objectHas'
import { devLog } from '@soujvnunes/utils/devLog'
import { matchesQuery } from '@soujvnunes/utils/matchesQuery'
import { formatTimestamp } from '@soujvnunes/utils/formatTimestamp'
```

| Subpath             | Export            | What                                                               |
| ------------------- | ----------------- | ------------------------------------------------------------------ |
| `./ellipses`        | `ellipses`        | Truncate a string to `head…tail`                                   |
| `./objectHas`       | `objectHas`       | Narrow an untrusted key to `keyof O` (own-key check)               |
| `./devLog`          | `devLog`          | Scope-tagged `console.log`, no-op outside `NODE_ENV=development`   |
| `./matchesQuery`    | `matchesQuery`    | Validate + type-narrow `searchParams` against an allow-list schema |
| `./formatTimestamp` | `formatTimestamp` | `Intl.DateTimeFormat` wrapper (locale-aware)                       |
