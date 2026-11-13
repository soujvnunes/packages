import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { Bar } from './Bar'
import { Button } from './Button'
import { ButtonGroup } from './ButtonGroup'
import { Card } from './Card'
import { CardDescription } from './CardDescription'
import { CardTitle } from './CardTitle'
import { Field } from './Field'
import { Input } from './Input'
import './styles/badge.css'
import './styles/bar.css'
import './styles/button-group.css'
import './styles/button.css'
import './styles/card.css'
import './styles/field.css'
import './styles/input.css'
import './styles/radius.css'
const BAR_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--bar-color': 'var(--color-neutral)',
  '--bar-background-color': 'var(--color-neutral-10)',
  '--field-color': 'var(--color-neutral)',
  '--field-background-color': 'var(--color-neutral-10)',
  '--button-group-background-color': 'var(--color-neutral-10)',
  '--card-color': 'var(--color-neutral)',
  '--card-background-color': 'var(--color-surface)',
  '--card-border-color': 'var(--color-neutral-20)',
  '--button-color': 'var(--color-neutral)',
  '--button-border-color': 'var(--color-neutral-60)',
  '--button-background-color': 'var(--color-neutral-10)',
  '--button-background-color--hover': 'var(--color-neutral-20)',
  '--button-background-color--active': 'var(--color-neutral-40)',
  '--button-text-color--disabled': 'var(--color-neutral-60)',
  '--button-outline-color--focus': 'var(--color-neutral)',
  '--button-main-outline-color--focus': 'var(--color-neutral)',
  '--input-color': 'var(--color-neutral)',
  '--input-background-color': 'var(--color-surface)',
  '--input-placeholder-color': 'var(--color-neutral-60)',
  '--input-border-color': 'var(--color-neutral-60)',
  '--input-border-color--hover': 'var(--color-neutral-80)',
  '--input-border-color--focus': 'var(--color-neutral-80)',
  '--input-outline-color--focus': 'var(--color-neutral)',
  '--badge-color': 'var(--color-main)',
  '--badge-text-color': 'var(--color-neutral)',
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
export const RadiusCases: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-40 overflow-x-auto">
      <figure className="flex flex-wrap items-start gap-16">
        <figcaption className="basis-full">
          Within: every control takes the inner radius of what holds it
        </figcaption>
        <Card className="grid justify-items-start gap-16">
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
          <Button kind="card" startItem="Lot 13">
            Volkswagen Fusca 1973
          </Button>
          <Button data-tone="main">Place a bid</Button>
        </Card>
        <Field label="Plate">{(control) => <Input {...control} placeholder="ABC1D23" />}</Field>
        <Bar>
          <Button>Watch</Button>
          <Button data-tone="main">Bid</Button>
        </Bar>
        <Button>
          <Badge>New</Badge>
          Lot 12
        </Button>
      </figure>
      <figure className="flex flex-wrap items-start gap-16">
        <figcaption className="basis-full">
          Close: a control on the edge of what holds it shares its radius there
        </figcaption>
        <ButtonGroup aria-label="Period">
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Lot actions" orientation="vertical">
          <Button>Watch</Button>
          <Button>Share</Button>
        </ButtonGroup>
        <Button kind="card" size="lg" startItem="Lot 12">
          Volkswagen Fusca 1973
          <Badge data-corner="top-end">New</Badge>
        </Button>
      </figure>
      <figure className="flex flex-wrap items-start gap-16">
        <figcaption className="basis-full">
          Outside: siblings keep the radius of their own height
        </figcaption>
        <Button>Watch</Button>
        <Input aria-label="Lot number" placeholder="12" className={{ root: 'flex-1' }} />
        <Badge>New</Badge>
      </figure>
    </div>
  ),
}
