import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon } from './Icon'
import { INPUT_KINDS, INPUT_SIZES, Input } from './Input'
import './styles/input.css'
const INPUT_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--input-color': 'var(--color-neutral)',
  '--input-background-color': 'var(--color-surface)',
  '--input-text-color--disabled': 'var(--color-neutral-60)',
  '--input-placeholder-color': 'var(--color-neutral-60)',
  '--input-border-color': 'var(--color-neutral-60)',
  '--input-border-color--hover': 'var(--color-neutral-80)',
  '--input-border-color--focus': 'var(--color-neutral-80)',
  '--input-border-color--invalid': 'var(--color-error-80)',
  '--input-border-color--disabled': 'var(--color-neutral-40)',
  '--input-outline-color--focus': 'var(--color-neutral)',
}
const SEARCH = (
  <Icon
    iconNode={[
      ['circle', { cx: '11', cy: '11', r: '7', key: 'lens' }],
      ['path', { d: 'm20 20-4-4', key: 'handle' }],
    ]}
  />
)
type InputMeta = Meta<typeof Input>
const meta = {
  title: 'Components/Input',
  component: Input,
  args: { 'aria-label': 'Plate', placeholder: 'ABC1D23' },
  decorators: [
    (Story) => (
      <div style={INPUT_THEME} className="grid grid-cols-1 gap-16 lg:grid-cols-2">
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
    <>
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
    </>
  ),
}
export const States: Story = {
  render: (args) => (
    <>
      <Input {...args} aria-label="Enabled" placeholder="Enabled" />
      <Input {...args} aria-label="Invalid" placeholder="Invalid" aria-invalid />
      <Input {...args} aria-label="Disabled" placeholder="Disabled" disabled />
    </>
  ),
}
