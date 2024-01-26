import React from 'react';

import { ProFormField } from '@ant-design/pro-form';
import type { ProFormFieldItemProps } from '@ant-design/pro-form/lib/typing';

import Select from '../Select';
import type { SelectProps } from '../Select';

export type ProFormSelectProps = ProFormFieldItemProps<SelectProps> & {
  options?: SelectProps['options'];
};

const ProFormSelect: React.FC<ProFormSelectProps> = (props) => {
  const { fieldProps, options } = props;

  return (
    <ProFormField {...props}>
      <Select {...fieldProps} options={options}></Select>
    </ProFormField>
  );
};

export default ProFormSelect;
