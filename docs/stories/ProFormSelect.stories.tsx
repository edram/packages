import type { Meta, StoryObj } from '@storybook/react';
import { ProForm, ProFormText } from '@ant-design/pro-components';

import { ProFormSelect as Component } from '@edram/antd';

const meta: Meta<typeof Component> = {
  component: Component,
};

export default meta;
type Story = StoryObj<typeof Component>;

export const ProFormSelect: Story = {
  render: () => {
    return (
      <ProForm
        onFinish={async (value) => {
          console.log(value);
        }}
      >
        <ProFormText name="text" label="文本"></ProFormText>
        <Component
          name="select"
          label="选择"
          options={[{ label: 'beijing', value: 'beijing' }]}
          fieldProps={{
            allowCreate: true,
          }}
          placeholder="Please select a country"
          rules={[{ required: true, message: 'Please select your country!' }]}
        ></Component>
      </ProForm>
    );
  },
};
