/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { SelectProps as AntSelectProps, RefSelectProps } from 'antd';
import { Select as AntSelect } from 'antd';
import type { BaseOptionType, DefaultOptionType } from 'antd/lib/select';
import { isArray } from '@edram/utils';
import { useMemo, useState } from 'react';

export type SelectProps<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
> = AntSelectProps<ValueType, OptionType> & {
  allowCreate?: boolean;
};

const InternalSelect = <
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(
  props: SelectProps<ValueType, OptionType>,
  ref: React.Ref<RefSelectProps>,
) => {
  const { allowCreate, ...antProps } = props;
  const showSearch = allowCreate ? true : props.showSearch;
  const [searchValue, setSearchValue] = useState<string>();
  const [newOptions, setNewOptions] = useState<OptionType[]>([]);

  const options = useMemo(() => {
    const options = antProps.options;
    if (!allowCreate) {
      return options;
    }

    const result = [...(options ?? []), ...newOptions] as OptionType[];

    if (searchValue != '' && searchValue != null) {
      if (result?.some((it) => it.label === searchValue) === false) {
        result.push({ label: searchValue, value: searchValue } as OptionType);
      }
    }

    return result;
  }, [allowCreate, newOptions, antProps.options, searchValue]);

  if (allowCreate !== true) {
    return <AntSelect {...props} />;
  }

  return (
    <AntSelect<ValueType, OptionType>
      {...antProps}
      ref={ref}
      showSearch={showSearch}
      onChange={(value, option) => {
        if (option == undefined) {
          setNewOptions([]);
        }
        if (option != undefined) {
          const selectOptions = isArray(option) ? option : [option];
          // 不在 props.options 里的代表是新建的
          const newOptions: OptionType[] = [];
          for (const item of selectOptions) {
            if (props.options?.some((it) => it.value === item.value) !== true) {
              newOptions.push(item);
            }
          }
          setNewOptions(newOptions);
        }

        props.onChange?.(value, option);
      }}
      searchValue={searchValue}
      onSearch={(value) => {
        setSearchValue(value);
      }}
      options={options}
    />
  );
};

const Select = React.forwardRef(InternalSelect) as unknown as (<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(
  props: React.PropsWithChildren<SelectProps<ValueType, OptionType>> &
    React.RefAttributes<RefSelectProps>,
) => React.ReactElement) & {
  displayName?: string;
};

if (process.env.NODE_ENV !== 'production') {
  Select.displayName = 'Select';
}

export default Select;
