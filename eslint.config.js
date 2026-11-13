import { createBaseConfig } from '@soujvnunes/eslint-config'

export default createBaseConfig({
  ignores: ['**/*.md', '**/*.d.ts', '.changeset/**'],
  extend: [
    {
      files: [
        'eslint-config/createClassifier.ts',
        'eslint-config/noComments.ts',
        'eslint-config/index.ts',
      ],
      rules: { 'max-lines': 'off' },
    },
    { files: ['ui/*.config.ts'], rules: { 'import-x/no-default-export': 'off' } },
  ],
})
