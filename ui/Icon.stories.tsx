import type { Meta, StoryObj } from '@storybook/react-vite'
import { ICON_SIZES, Icon, type IconNode } from './Icon'
const CHECK: IconNode = [['path', { d: 'M20 6 9 17l-5-5', key: 'check' }]]
type IconMeta = Meta<typeof Icon>
const meta = { title: 'Components/Icon', component: Icon, args: { iconNode: CHECK } } satisfies IconMeta
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-16">
      {ICON_SIZES.map((size) => (
        <Icon key={size} {...args} size={size} />
      ))}
    </div>
  ),
}
