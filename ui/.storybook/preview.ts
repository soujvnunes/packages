import type { Preview } from '@storybook/react-vite'
import './theme.css'
import '../styles/icon.css'
const preview: Preview = {
  parameters: { controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } } },
}
export default preview
