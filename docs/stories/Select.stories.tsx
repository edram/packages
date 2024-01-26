import type { Meta, StoryObj } from '@storybook/react';

import { Select as Component } from '@edram/antd';

const meta: Meta<typeof Component> = {
  component: Component,
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Select: Story = {
  args: {
    allowCreate: true,
    options: [{ label: 'beijing', value: 'beijing' }],
    placeholder: '请选择城市',
  },
};
