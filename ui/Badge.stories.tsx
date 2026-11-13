import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { Icon } from './Icon'
import './styles/badge.css'
const BADGE_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--badge-background-color': 'var(--color-main-20)',
  '--badge-color': 'var(--color-neutral)',
  '--badge-border-color': 'var(--color-main-60)',
}
const DOT = (
  <Icon
    iconNode={[['circle', { cx: '12', cy: '12', r: '8', key: 'dot' }]]}
    fill="currentColor"
    stroke="none"
  />
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
