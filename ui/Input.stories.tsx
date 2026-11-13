import type { Meta, StoryObj } from '@storybook/react-vite'
import { INPUT_KINDS, INPUT_SIZES, Input } from './Input'
import './styles/input.css'
const INPUT_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--input-background-color': 'var(--color-surface)',
  '--input-color': 'var(--color-neutral)',
  '--input-color--disabled': 'var(--color-neutral-40)',
  '--input-placeholder-color': 'var(--color-neutral-60)',
  '--input-border-color': 'var(--color-neutral-20)',
  '--input-border-color--hover': 'var(--color-neutral-40)',
  '--input-border-color--focus': 'var(--color-main)',
  '--input-border-color--invalid': 'var(--color-error)',
  '--input-border-color--disabled': 'var(--color-neutral-10)',
  '--input-outline-color--focus': 'var(--color-main-40)',
}
const SEARCH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
)
type InputMeta = Meta<typeof Input>
const meta = {
  title: 'Components/Input',
  component: Input,
  args: { 'aria-label': 'Plate', placeholder: 'ABC1D23' },
  decorators: [
    (Story) => (
      <div style={INPUT_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies InputMeta
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const KindsBySize: Story = {
  render: (args) => (
    <div className="grid justify-items-start gap-16">
      {INPUT_KINDS.flatMap((kind) =>
        INPUT_SIZES.map((size) => (
          <Input
            key={`${kind}-${size}`}
            {...args}
            aria-label={`Search, ${kind} ${size}`}
            placeholder={`${kind} ${size}`}
            kind={kind}
            size={size}
            startItem={SEARCH}
            endItem="km"
          />
        )),
      )}
    </div>
  ),
}
export const States: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-16">
      <Input {...args} aria-label="Enabled" placeholder="Enabled" />
      <Input {...args} aria-label="Invalid" placeholder="Invalid" aria-invalid />
      <Input {...args} aria-label="Disabled" placeholder="Disabled" disabled />
    </div>
  ),
}
