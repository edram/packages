import React from 'react';
import type { SelectProps as AntSelectProps } from 'antd';
import { Select as AntSelect } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { isArray } from '@edram/utils';
import { useMemo, useState } from 'react';

export type SelectProps = AntSelectProps & {
  allowCreate?: boolean;
};

const Select: React.FC<SelectProps> = ({ allowCreate, ...props }) => {
  const showSearch = allowCreate ? true : props.showSearch;
  const [searchValue, setSearchValue] = useState<string>();
  const [newOptions, setNewOptions] = useState<
    NonNullable<SelectProps['options']>
  >([]);

  const options = useMemo(() => {
    const options = props.options;
    if (!allowCreate) {
      return options;
    }

    const result = [
      ...(options ?? []),
      ...newOptions,
    ] as SelectProps['options'];

    if (searchValue != '' && searchValue != null) {
      if (result?.some((it) => it.label === searchValue) === false) {
        result.push({ label: searchValue, value: searchValue });
      }
    }

    return result;
  }, [allowCreate, newOptions, props.options, searchValue]);

  if (allowCreate !== true) {
    return <AntSelect {...props} />;
  }

  return (
    <AntSelect
      {...props}
      showSearch={showSearch}
      onChange={(value, option) => {
        if (option == undefined) {
          setNewOptions([]);
        }
        if (option != undefined) {
          const selectOptions = isArray(option) ? option : [option];
          // 不在 props.options 里的代表是新建的
          const newOptions: DefaultOptionType[] = [];
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

export default Select;
