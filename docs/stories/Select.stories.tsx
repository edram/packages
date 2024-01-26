import type { Meta, StoryObj } from '@storybook/react';

import { Select as Componnet } from '@edram/antd';

const meta: Meta<typeof Componnet> = {
  component: Componnet,
};

export default meta;
type Story = StoryObj<typeof Componnet>;

export const Select: Story = {
  args: {
    allowCreate: true,
    options: [{ label: 'beijing', value: 'beijing' }],
    placeholder: '请选择城市',
  },
};
