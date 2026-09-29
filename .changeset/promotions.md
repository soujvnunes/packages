---
'@soujvnunes/eslint-config': minor
---

`no-restricted-syntax` selectors are now a keyed record composed per file convention instead of one array turned fully off on `page.tsx`, `layout.tsx` and root config files: those overrides now drop only the two export-default selectors and keep everything else, so a `lucide-react` import or an enum inside `page.tsx` is still caught.

Three new selectors ride along in that same composition: a `lucide-react` import whose name does not end in `Icon` (`createLucideIcon`, `icons`, `dynamicIconImports` and any type-only import exempt), any import from `next/font/google`, and `cloneElement` both as a named `react` import and as `React.cloneElement`.

`jsx-a11y`'s recommended rules now run at error on the Next preset, not just registered with zero rules, and `settings['jsx-a11y'].components` maps `Link`, `Image`, `Button` and `Input` to the native element each renders.

Four more Next-preset additions: a `CallExpression[callee.name='cn'] > ConditionalExpression` ban (the callee name from the new `classMergeName` option, default `'cn'`), its own entry in the selector composition so the file-convention overrides cannot drop it independently; `better-tailwindcss/no-restricted-classes` bans an arbitrary-value utility class such as `text-[11px]` when `tailwindEntryPoint` is set, leaving a bracketed variant (`data-[state=open]:`, `[&_>_svg]:`) alone, with a new `allowArbitraryClasses` option for a shape with no theme token; `nextConfigModules` restricts `next.config.*` and the modules it names to relative imports; and two `Program`-selector overrides ban a barrel `**/index.{ts,tsx}` file and a loose file at a `**/features/*/*` root.

Two additions on both presets: `**/utils/**` restricts `server-only`, `next/*`, `react`, `@/lib/*` and `@/app/*`, so a pure helper module never imports a server-only boundary; and `max-lines` caps a module at 300 lines (skipping blank lines and comments, exempting `**/*.test.*` and `**/copy/**`).

New rule `soujvnunes/one-export-per-file` (one value export per module, a type export free of the count), always exported from the plugin but wired only through the new `strictExportGlobs` option, since a codebase with wide constants or phase-utility modules needs to adopt it folder by folder rather than repo-wide.
