import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { ButtonGroup } from './ButtonGroup'
import './styles/button-group.css'
import './styles/button.css'
import './styles/radius.css'
const BUTTON_GROUP_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--button-background-color': 'var(--color-surface)',
  '--button-background-color--hover': 'var(--color-neutral-10)',
  '--button-background-color--active': 'var(--color-neutral-20)',
  '--button-background-color--pressed': 'var(--color-main-20)',
  '--button-color': 'var(--color-neutral)',
  '--button-border-color': 'var(--color-neutral-20)',
  '--button-border-color--pressed': 'var(--color-main)',
  '--button-outline-color--focus': 'var(--color-main)',
}
const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  args: { 'aria-label': 'Period' },
  decorators: [
    (Story) => (
      <div style={BUTTON_GROUP_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ButtonGroup>
export default meta
type Story = StoryObj<typeof meta>
export const Horizontal: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  ),
}
export const Vertical: Story = {
  render: (args) => (
    <ButtonGroup {...args} orientation="vertical">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  ),
}
export const TabList: Story = {
  render: () => (
    <ButtonGroup asChild>
      <div role="tablist" aria-label="Lot">
        <Button asChild>
          <button type="button" role="tab" aria-selected>
            Bids
          </button>
        </Button>
        <Button asChild>
          <button type="button" role="tab" aria-selected={false}>
            History
          </button>
        </Button>
        <Button asChild>
          <button type="button" role="tab" aria-selected={false}>
            Documents
          </button>
        </Button>
      </div>
    </ButtonGroup>
  ),
}
