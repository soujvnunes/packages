import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
import './styles/badge.css'
import './styles/button.css'
import './styles/card.css'
import './styles/radius.css'
const CARD_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--card-background-color': 'var(--color-surface)',
  '--card-color': 'var(--color-neutral)',
  '--card-border-color': 'var(--color-neutral-20)',
  '--badge-background-color': 'var(--color-main-20)',
  '--badge-color': 'var(--color-neutral)',
  '--button-main-background-color': 'var(--color-main)',
  '--button-main-background-color--hover': 'var(--color-main-80)',
  '--button-main-outline-color--focus': 'var(--color-main)',
}
const meta = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div style={CARD_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>
export const TitleDescriptionButtonAndBadge: Story = {
  render: (args) => (
    <Card {...args} className="grid justify-items-start gap-16">
      <Badge>New</Badge>
      <CardTitle className="text-title">Volkswagen Fusca 1973</CardTitle>
      <CardDescription className="text-body">Lot 12, open until 20h</CardDescription>
      <Button data-tone="main">Place a bid</Button>
    </Card>
  ),
}
