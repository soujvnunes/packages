import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bar } from './Bar'
import { Button } from './Button'
import './styles/bar.css'
import './styles/button.css'
import './styles/radius.css'
const BAR_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--bar-background-color': 'var(--color-surface)',
  '--bar-color': 'var(--color-neutral)',
  '--button-background-color': 'var(--color-neutral-10)',
  '--button-background-color--hover': 'var(--color-neutral-20)',
  '--button-color': 'var(--color-neutral)',
  '--button-border-color': 'var(--color-neutral-20)',
  '--button-outline-color--focus': 'var(--color-main)',
  '--button-main-background-color': 'var(--color-main)',
  '--button-main-background-color--hover': 'var(--color-main-80)',
  '--button-main-outline-color--focus': 'var(--color-main)',
}
type BarMeta = Meta<typeof Bar>
const meta = {
  title: 'Components/Bar',
  component: Bar,
  decorators: [
    (Story) => (
      <div style={BAR_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies BarMeta
export default meta
type Story = StoryObj<typeof meta>
export const HeaderWithButtons: Story = {
  render: (args) => (
    <Bar {...args} asChild>
      <header>
        <strong className="grow">Lot 12</strong>
        <Button>Watch</Button>
        <Button data-tone="main">Place a bid</Button>
      </header>
    </Bar>
  ),
}
