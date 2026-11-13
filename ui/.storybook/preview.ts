import type { Preview } from '@storybook/react-vite'
import { themes } from 'storybook/theming'
import './theme.css'
const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    docs: {
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? themes.dark : themes.light,
    },
  },
}
export default preview
