import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { BUTTON_KINDS, BUTTON_SIZES, BUTTON_TONES, Button } from './Button'
import { Icon } from './Icon'
import './styles/badge.css'
import './styles/button.css'
const BUTTON_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--button-background-color': 'var(--color-neutral-10)',
  '--button-background-color--hover': 'var(--color-neutral-20)',
  '--button-background-color--active': 'var(--color-neutral-40)',
  '--button-background-color--pressed': 'var(--color-main-20)',
  '--button-background-color--disabled': 'var(--color-neutral-40)',
  '--button-color': 'var(--color-neutral)',
  '--button-color--disabled': 'var(--color-neutral-60)',
  '--button-border-color': 'var(--color-neutral-60)',
  '--button-border-color--pressed': 'var(--color-main-80)',
  '--button-outline-color--focus': 'var(--color-main)',
  '--button-main-background-color': 'var(--color-main)',
  '--button-main-background-color--hover': 'var(--color-main-80)',
  '--button-main-background-color--active': 'var(--color-main-60)',
  '--button-main-background-color--disabled': 'var(--color-main-40)',
  '--button-main-outline-color--focus': 'var(--color-main)',
  '--button-accent-background-color': 'var(--color-accent)',
  '--button-accent-background-color--hover': 'var(--color-accent-80)',
  '--button-accent-outline-color--focus': 'var(--color-main)',
  '--button-success-background-color': 'var(--color-success)',
  '--button-success-background-color--hover': 'var(--color-success-80)',
  '--button-success-outline-color--focus': 'var(--color-main)',
  '--button-warning-background-color': 'var(--color-warning)',
  '--button-warning-background-color--hover': 'var(--color-warning-80)',
  '--button-warning-outline-color--focus': 'var(--color-main)',
  '--button-error-background-color': 'var(--color-error)',
  '--button-error-background-color--hover': 'var(--color-error-80)',
  '--button-error-outline-color--focus': 'var(--color-main)',
  '--badge-background-color': 'var(--color-surface)',
  '--badge-color': 'var(--color-neutral)',
}
const PLUS = <Icon iconNode={[['path', { d: 'M12 5v14M5 12h14', key: 'plus' }]]} />
const ARROW = <Icon iconNode={[['path', { d: 'M5 12h14M13 6l6 6-6 6', key: 'arrow' }]]} />
type ButtonMeta = Meta<typeof Button>
const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Place a bid', 'data-tone': 'main' },
  decorators: [
    (Story) => (
      <div style={BUTTON_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies ButtonMeta
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const KindsBySize: Story = {
  render: (args) => (
    <div className="grid grid-cols-1 items-start justify-items-start gap-16 lg:grid-cols-3">
      {BUTTON_KINDS.flatMap((kind) =>
        BUTTON_SIZES.map((size) => (
          <Button
            key={`${kind}-${size}`}
            {...args}
            kind={kind}
            size={size}
            aria-label={kind === 'icon' ? `Add, ${size}` : undefined}
            startItem={kind === 'icon' ? undefined : PLUS}
            endItem={kind === 'icon' ? undefined : ARROW}>
            {kind === 'icon' ? PLUS : `${kind} ${size}`}
          </Button>
        )),
      )}
    </div>
  ),
}
export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-16">
      <Button {...args} data-tone={undefined}>
        No tone
      </Button>
      {BUTTON_TONES.map((tone) => (
        <Button key={tone} {...args} data-tone={tone}>
          {tone}
        </Button>
      ))}
    </div>
  ),
}
export const States: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-16">
      <Button {...args}>Enabled</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} aria-disabled>
        Announced disabled
      </Button>
      <Button {...args} data-tone={undefined} aria-pressed>
        Pressed
      </Button>
      <Button {...args} data-tone={undefined} stateful aria-pressed={false}>
        Stateful, inactive
      </Button>
      <Button {...args} responsive={false}>
        Static
      </Button>
    </div>
  ),
}
export const ContentBetween: Story = {
  render: (args) => (
    <div className="flex flex-col gap-16">
      <Button {...args} kind="fullWidth" startItem={PLUS} endItem={ARROW}>
        Spread apart
      </Button>
      <Button {...args} kind="fullWidth" startItem={PLUS} endItem={ARROW} disableContentBetween>
        End item at the far edge
      </Button>
    </div>
  ),
}
export const BadgeInButton: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-16 lg:flex-row lg:items-center">
      <Button {...args} size="md">
        <Badge>New</Badge>
        Lot 12
      </Button>
      <Button {...args} size="md">
        Lot 12
        <Badge>New</Badge>
      </Button>
    </div>
  ),
}
export const TabFromButton: Story = {
  render: (args) => (
    <div role="tablist" aria-label="Lot" className="flex gap-8">
      <Button {...args} data-tone={undefined} asChild>
        <button type="button" role="tab" aria-selected>
          Bids
        </button>
      </Button>
      <Button {...args} data-tone={undefined} asChild>
        <button type="button" role="tab" aria-selected={false}>
          History
        </button>
      </Button>
    </div>
  ),
}
