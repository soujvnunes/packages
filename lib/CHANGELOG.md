# @soujvnunes/lib

## 0.1.3

### Patch Changes

- 89df975: Swept em dashes out of every source comment and package description, per the house plain-writing voice. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.1.2

### Patch Changes

- 9a76f9c: Docs: rewrite the package READMEs in the house plain voice (no em dashes, no AI tells). No code or API change.

## 0.1.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.1.0

### Minor Changes

- 13a1a38: Initial release: stateful modules with optional-peer subpaths — `./mongoose` (serverless Mongoose client: `withDb`, `withDbCallback`, `getDbClient`, `getDB`) and `./typegoose` (`BaseModel`, `BaseTimestampedModel`).
