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
  '--bar-background-color': 'var(--color-neutral-10)',
  '--bar-color': 'var(--color-neutral)',
  '--field-background-color': 'var(--color-neutral-10)',
  '--field-color': 'var(--color-neutral)',
  '--card-background-color': 'var(--color-surface)',
  '--card-color': 'var(--color-neutral)',
  '--card-border-color': 'var(--color-neutral-20)',
  '--button-background-color': 'var(--color-neutral-10)',
  '--button-background-color--hover': 'var(--color-neutral-20)',
  '--button-color': 'var(--color-neutral)',
  '--button-border-color': 'var(--color-neutral-20)',
  '--button-outline-color--focus': 'var(--color-main)',
  '--button-main-background-color': 'var(--color-main)',
  '--button-main-background-color--hover': 'var(--color-main-80)',
  '--button-main-outline-color--focus': 'var(--color-main)',
  '--input-background-color': 'var(--color-surface)',
  '--input-color': 'var(--color-neutral)',
  '--input-placeholder-color': 'var(--color-neutral-60)',
  '--input-border-color': 'var(--color-neutral-20)',
  '--input-border-color--focus': 'var(--color-main)',
  '--input-outline-color--focus': 'var(--color-main-40)',
  '--badge-background-color': 'var(--color-main-20)',
  '--badge-color': 'var(--color-neutral)',
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
    <div className="grid gap-40">
      <figure className="flex flex-wrap items-start gap-16">
        <figcaption className="basis-full">
          Within: a control takes the inner radius of what holds it
        </figcaption>
        <Bar>
          <Button>Watch</Button>
          <Button data-tone="main">Bid</Button>
        </Bar>
        <Field label="Plate">
          <Input placeholder="ABC1D23" />
        </Field>
        <Card className="grid justify-items-start gap-16">
          <CardTitle>Lot 12</CardTitle>
          <CardDescription>Open until 20h</CardDescription>
          <Button data-tone="main">Place a bid</Button>
        </Card>
        <Button size="lg">
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
        <Input aria-label="Lot number" placeholder="12" />
        <Badge>New</Badge>
      </figure>
    </div>
  ),
}
