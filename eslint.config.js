// Dogfood: this monorepo lints itself with its own base config.
import { createBaseConfig } from '@soujvnunes/eslint-config'

export default createBaseConfig({ ignores: ['**/*.md', '**/*.d.ts', '.changeset/**'] })
