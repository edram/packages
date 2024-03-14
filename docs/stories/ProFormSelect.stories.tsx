import type { Meta, StoryObj } from '@storybook/react';
import {
  ProForm,
  ProFormText,
  ProFormSelect as ProFormSelectComponent,
} from '@ant-design/pro-components';

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
        <ProFormSelectComponent
          name="select1"
          width="lg"
          label="选择"
          request={async () => {
            return [
              { label: 'beijing', value: 'beijing' },
              { label: 'shanghai', value: 'shanghai' },
            ];
          }}
          placeholder="Please select a country"
          rules={[{ required: true, message: 'Please select your country!' }]}
        ></ProFormSelectComponent>

        <Component
          name="select2"
          width="lg"
          label="选择"
          request={async () => {
            return [
              { label: 'beijing', value: 'beijing' },
              { label: 'shanghai', value: 'shanghai' },
            ];
          }}
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
