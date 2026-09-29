import type { SourceCode } from 'eslint'
// Taken from ESLint's own surface rather than importing `estree`, which is only a transitive type package here and does not resolve.
export type Comment = ReturnType<SourceCode['getAllComments']>[number]
export type Neighbour = ReturnType<SourceCode['getTokenAfter']>
// A comment carrying machine semantics is exempt, run and all: joining puts prose in front of the keyword and the tool stops seeing the directive, and rewriting its delimiters hides it from a tool that reads one form only. There is no correct one-line form for a mixed run either, since TypeScript skips intervening comment lines when matching `@ts-expect-error` and ESLint does not, so both would have to be first.
const DIRECTIVE =
  /^\s*(?:eslint-disable\b|eslint-enable\b|\/\s*<|prettier-ignore|biome-ignore|(?:istanbul|c8|v8)\s+ignore\b|webpack[A-Z])/u
// `global`, `globals`, `exported`, `eslint` and `eslint-env` are directives ONLY in a block comment, so matching them on a line comment would exempt ordinary prose: `// global state lives here` is not a directive.
const BLOCK_DIRECTIVE = /^\s*(?:eslint\s|eslint-env\b|global\s|globals\s|exported\s)/u
// Machine-read annotations open with a sigil (`@ts-expect-error`, `@jsxFrag`, `@__PURE__`, `#__NO_SIDE_EFFECTS__`, `# sourceMappingURL=`) or a `tool:` prefix (`node:coverage`), where prose opens with a word. Gating on the shape rather than on a list is what keeps a pragma the list never heard of from being welded into prose or rewritten into a form its tool cannot read. The list above keeps the word-shaped ones, and `\/\s*<` is every triple-slash directive (`reference`, `amd-module`, `amd-dependency`), whose value starts with the third slash.
const ANNOTATION = /^\s*[@#]/u
const BLOCK_ANNOTATION = /^\s*[\w-]+:\S/u
// Only what a person typed as a comment. The interpreter line is spelled `Shebang` from SourceCode and `Hashbang` from the tokenizer, so an allow-list catches both where a deny-list on one spelling rots. Takes any token, so the same predicate reads what follows a JSDoc.
export const isComment = (token: Neighbour) => token?.type === 'Line' || token?.type === 'Block'
// A `/**` opener is JSDoc-shaped whatever follows it. Whether it IS in place depends on what sits under it, which each rule decides.
export const isDocShaped = (comment: Comment) =>
  comment.type === 'Block' && comment.value.startsWith('*')
// The `/*!` banner is the minifier's keep marker, so it is the third block form with no `//` equivalent, after JSDoc and JSX.
export const isBanner = (comment: Comment) => comment.type === 'Block' && comment.value.startsWith('!')
// The stars are content in a JSDoc's value, so a pragma written as `/** @jsx h */` is read past them.
const pragmaText = (comment: Comment) => comment.value.replace(/^\*+/u, '')
export const isDirectiveText = (text: string) => DIRECTIVE.test(text) || ANNOTATION.test(text)
export const isDirective = (comment: Comment) =>
  isDirectiveText(pragmaText(comment)) ||
  (comment.type === 'Block' &&
    (BLOCK_DIRECTIVE.test(comment.value) ||
      (!isDocShaped(comment) && BLOCK_ANNOTATION.test(comment.value))))
export const spansLines = (comment: Comment) =>
  (comment.loc?.start.line ?? 0) !== (comment.loc?.end.line ?? 0)
// A `//` runs to the end of its line, so a block comment followed by anything on that line, code or another comment, has no line form.
export const followedOnLine = (comment: Comment, after: Neighbour) =>
  !!after?.loc && !!comment.loc && after.loc.start.line === comment.loc.end.line
