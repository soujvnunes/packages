import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import './styles/badge.css'
const BADGE_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--badge-background-color': 'var(--color-main-20)',
  '--badge-color': 'var(--color-neutral)',
  '--badge-border-color': 'var(--color-main-40)',
}
const DOT = (
  <svg viewBox="0 0 8 8" fill="currentColor">
    <circle cx="4" cy="4" r="4" />
  </svg>
)
type BadgeMeta = Meta<typeof Badge>
const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'New' },
  decorators: [
    (Story) => (
      <div style={BADGE_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies BadgeMeta
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithStartItem: Story = { args: { startItem: DOT, children: 'Live' } }
export const AsLink: Story = {
  render: (args) => (
    <Badge {...args} asChild>
      <a href="#lot-12">Lot 12</a>
    </Badge>
  ),
}
