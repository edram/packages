import React from 'react';

import { ProFormField } from '@ant-design/pro-form';
import { createField } from '@ant-design/pro-form/es/BaseForm';
import type { ProFormFieldItemProps } from '@ant-design/pro-form/lib/typing';

import Select from '../Select';
import type { SelectProps } from '../Select';

export type ProFormSelectProps = ProFormFieldItemProps<SelectProps> & {
  options?: SelectProps['options'];
};

const BaseProFormSelect: React.FC<ProFormSelectProps> = (props) => {
  const { fieldProps, options } = props;

  return (
    <ProFormField {...props}>
      <Select {...fieldProps} options={options}></Select>
    </ProFormField>
  );
};

const ProFormSelect = createField(
  BaseProFormSelect,
) as typeof BaseProFormSelect;

export default ProFormSelect;
