import type { Meta, StoryObj } from '@storybook/react';
import { ProFormRadio, ProFormText } from '@ant-design/pro-components';

import { useState } from 'react';
import { ProForm as Component } from '@edram/antd';
import type { ProFormType } from '@edram/antd';

const meta: Meta<typeof Component> = {
  component: Component,
};

export default meta;
type Story = StoryObj<typeof Component>;

type FormValue = {
  text: string;
};

export const ProForm: Story = {
  render: () => {
    const [type, setType] = useState<ProFormType>('modal');
    const [open, setOpen] = useState<boolean>(true);
    console.log('type', type, 'open', open);

    return (
      <>
        <Component<FormValue, any>
          type={type}
          open={open}
          onOpenChange={setOpen}
          loading={false}
          modalProps={{}}
          drawerProps={{}}
          onFinish={async (value) => {
            console.log(value);
          }}
        >
          <ProFormRadio.Group
            label="类型"
            radioType="button"
            options={['modal', 'drawer', 'query', 'light', 'form']}
            fieldProps={{
              value: type,
              onChange: (e) => setType(e.target.value),
            }}
          ></ProFormRadio.Group>
          <ProFormText name="text" label="文本"></ProFormText>
        </Component>
      </>
    );
  },
};
