import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'
const STYLES_DIR = 'styles'
const OUT_DIR = 'dist'
const writeStylesheet = async () => {
  const files = (await readdir(STYLES_DIR)).filter((file) => file.endsWith('.css')).sort()
  const sheets = await Promise.all(files.map((file) => readFile(`${STYLES_DIR}/${file}`, 'utf8')))
  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(`${OUT_DIR}/styles.css`, sheets.join('\n'))
}
export default defineConfig({
  entry: ['*.ts', '*.tsx', '!*.test.tsx', '!*.stories.tsx', '!*.config.ts'],
  format: 'esm',
  outDir: OUT_DIR,
  bundle: false,
  dts: true,
  clean: true,
  onSuccess: writeStylesheet,
})
