import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Field } from './Field'
import { Input } from './Input'
import './styles/button.css'
import './styles/field.css'
import './styles/input.css'
import './styles/radius.css'
const FIELD_THEME: React.CSSProperties & Record<`--${string}`, string> = {
  '--field-color': 'var(--color-neutral)',
  '--field-background-color': 'var(--color-surface)',
  '--field-hint-color': 'var(--color-neutral-60)',
  '--field-error-color': 'var(--color-error)',
  '--input-color': 'var(--color-neutral)',
  '--input-background-color': 'var(--color-surface)',
  '--input-placeholder-color': 'var(--color-neutral-60)',
  '--input-border-color': 'var(--color-neutral-60)',
  '--input-border-color--hover': 'var(--color-neutral-80)',
  '--input-border-color--focus': 'var(--color-neutral-80)',
  '--input-border-color--invalid': 'var(--color-error-80)',
  '--input-outline-color--focus': 'var(--color-neutral)',
  '--button-main-outline-color--focus': 'var(--color-neutral)',
}
const meta = {
  title: 'Components/Field',
  component: Field,
  decorators: [
    (Story) => (
      <div style={FIELD_THEME}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof Field>
export const WithInput: Story = {
  render: () => (
    <Field label="Max bid" hint="At least R$ 51.000">
      {(control) => <Input {...control} kind="fullWidth" placeholder="R$ 51.000" />}
    </Field>
  ),
}
export const WithError: Story = {
  render: () => (
    <Field label="Max bid" hint="At least R$ 51.000" error="Your bid must be at least R$ 51.000">
      {(control) => <Input {...control} kind="fullWidth" placeholder="R$ 51.000" />}
    </Field>
  ),
}
export const WithItems: Story = {
  render: () => (
    <Field label="Max bid" startItem="R$" endItem={<Button data-tone="main">Bid</Button>}>
      {(control) => <Input {...control} kind="fullWidth" placeholder="51.000" />}
    </Field>
  ),
}
