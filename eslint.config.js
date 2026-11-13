import { createBaseConfig } from '@soujvnunes/eslint-config'

export default createBaseConfig({
  ignores: ['**/*.md', '**/*.d.ts', '.changeset/**', '**/storybook-static/**'],
  extend: [
    {
      files: [
        'eslint-config/createClassifier.ts',
        'eslint-config/noComments.ts',
        'eslint-config/index.ts',
      ],
      rules: { 'max-lines': 'off' },
    },
    {
      files: ['ui/*.config.ts', 'ui/*.stories.tsx', 'ui/.storybook/*.ts'],
      rules: { 'import-x/no-default-export': 'off' },
    },
    { files: ['ui/.storybook/main.ts'], rules: { 'import-x/no-cycle': 'off' } },
  ],
})
