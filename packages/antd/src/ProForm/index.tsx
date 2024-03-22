import type {
  ModalFormProps,
  DrawerFormProps,
  LightFilterProps,
  ProFormProps as AntProFormProps,
} from '@ant-design/pro-form';
import {
  DrawerForm,
  LightFilter,
  ModalForm,
  QueryFilter,
  ProForm as AntProForm,
} from '@ant-design/pro-form';
import type { QueryFilterProps } from '@ant-design/pro-form/lib';
import React, { useMemo } from 'react';

const Map = {
  modal: ModalForm,
  drawer: DrawerForm,
  query: QueryFilter,
  light: LightFilter,
  form: AntProForm,
};

export type ProFormProps<T, U> =
  | ({
      type: 'modal';
    } & ModalFormProps<T, U>)
  | ({
      type: 'drawer';
    } & DrawerFormProps<T, U>)
  | ({
      type: 'query';
    } & QueryFilterProps<T>)
  | ({
      type: 'light';
    } & LightFilterProps<T, U>)
  | ({
      type: 'form';
    } & AntProFormProps<T, U>);

export type ProFormType = keyof typeof Map;

const getComponentByType = (type: keyof typeof Map) => {
  return Map[type];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function ProForm<T = Record<string, any>, U = Record<string, any>>(
  props: ProFormProps<T, U>,
) {
  const { type, ...rest } = props;

  const Component = useMemo(() => {
    return getComponentByType(type);
  }, [type]);

  if (!Component) {
    return null;
  }

  // @ts-expect-error 泛型参数不一致
  return <Component<T, U> {...rest}></Component>;
}

export default ProForm;
