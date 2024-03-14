/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext } from 'react';

import { FieldContext } from '@ant-design/pro-form';
import type { BaseOptionType } from 'antd/lib/select';
import { runFunction } from '@ant-design/pro-utils';
import type { RefSelectProps } from 'antd';
import type {
  ProFormFieldItemProps,
  ProFormFieldRemoteProps,
} from '@ant-design/pro-form/lib/typing';
import type { SelectProps } from '../Select';
import ProFormField from '../ProFormField';

export type ProFormSelectProps<
  ValueType = any,
  OptionType extends BaseOptionType = any,
> = ProFormFieldItemProps<
  SelectProps<ValueType> & {
    /**
     * 是否在输入框聚焦时触发搜索
     *
     * @default false
     */
    searchOnFocus?: boolean;
    /**
     * 选择完一个之后是否清空搜索项重新搜索
     *
     * @default false
     */
    resetAfterSelect?: boolean;
    /**
     * 当搜索关键词发生变化时是否请求远程数据
     *
     * @default true
     */
    fetchDataOnSearch?: boolean;
    /** 自定义选项渲染 */
    optionItemRender?: (item: ValueType) => React.ReactNode;
  },
  RefSelectProps
> & {
  options?: SelectProps<ValueType, OptionType>['options'] | string[];
  mode?: SelectProps<ValueType, OptionType>['mode'] | 'single';
  showSearch?: SelectProps<ValueType, OptionType>['showSearch'];
  readonly?: boolean;
  onChange?: SelectProps<ValueType, OptionType>['onChange'];
} & ProFormFieldRemoteProps;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseProFormSelect = <T, OptionType extends BaseOptionType = any>(
  {
    fieldProps,
    children,
    params,
    proFieldProps,
    mode,
    valueEnum,
    request,
    showSearch,
    options,
    ...rest
  }: ProFormSelectProps<T, OptionType>,
  ref: any,
) => {
  const context = useContext(FieldContext);

  return (
    <ProFormField<any>
      valueEnum={runFunction(valueEnum)}
      request={request}
      params={params}
      valueType="select"
      filedConfig={{ customLightMode: true }}
      fieldProps={
        {
          options,
          mode,
          showSearch,
          getPopupContainer: context.getPopupContainer,
          ...fieldProps,
        } as SelectProps<any>
      }
      ref={ref}
      proFieldProps={proFieldProps}
      {...rest}
    >
      {children}
    </ProFormField>
  );
};

const ProFormSelect = React.forwardRef(BaseProFormSelect) as <
  T,
  OptionType extends BaseOptionType = any,
>(
  props: ProFormSelectProps<T, OptionType>,
) => React.ReactElement;

export default ProFormSelect;
