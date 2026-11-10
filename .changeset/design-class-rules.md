---
'@soujvnunes/eslint-config': minor
---

Add a `design` option, `boolean | { dark?: boolean }`, that appends seven design class entries to `better-tailwindcss/no-restricted-classes` on the Next preset when `tailwindEntryPoint` is set. They report a `sm:`, `md:`, `max-sm:` or `max-md:` variant, a `dark:` variant (unless `design: { dark: true }`), motion classes with no `motion-safe:` variant, a stock font size, a number outside 0, 4, 8, 12, 16, 24, 40, 64, 104 and 168 on a spacing or size utility, an opacity modifier on a colour utility and any `max-w-*` class. Left unset, nothing changes for a consumer.
