# @soujvnunes/lib

## 0.1.5

### Patch Changes

- 7b4543b: The published type files no longer carry doc comments, so `createMongooseConnection`, `withDb`, `withDbCallback`, `BaseModel` and `BaseTimestampedModel` show no doc text on hover. Nothing else changed: the compiled output with comments removed is the same as before. The README now states the connect options `createMongooseConnection` defaults, when to use `withDb` and when `withDbCallback`, and what the two base classes type and add.

## 0.1.4

### Patch Changes

- cf50912: `createMongooseConnection` declares its return type as the exported `MongooseConnection` interface, so the docs on `withDb` and `withDbCallback` now reach the published types and show on hover. The inferred return type it replaces carried no docs at all.

## 0.1.3

### Patch Changes

- 89df975: Swept em dashes out of every source comment and package description, to keep the prose plain. No behaviour changes. The `lib` and `react` npm descriptions are the only reader-visible part.

## 0.1.2

### Patch Changes

- 9a76f9c: Docs: rewrite the package READMEs in a plain voice (no em dashes, no AI tells). No code or API change.

## 0.1.1

### Patch Changes

- 3c4914b: npm discoverability: add `keywords`, `homepage`, and `bugs` to every package; add the missing `@soujvnunes/stylelint-config` README, and correct the `@soujvnunes/prettier-config` install note (the Tailwind plugin is bundled, not a manual install).

## 0.1.0

### Minor Changes

- 13a1a38: Initial release: stateful modules with optional-peer subpaths — `./mongoose` (serverless Mongoose client: `withDb`, `withDbCallback`, `getDbClient`, `getDB`) and `./typegoose` (`BaseModel`, `BaseTimestampedModel`).
