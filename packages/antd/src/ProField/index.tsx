/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext } from 'react';
import { type ProFieldPropsType } from '@ant-design/pro-field';
import type { ProFieldFCRenderProps } from '@ant-design/pro-provider';
import ProConfigContext from '@ant-design/pro-provider';
import {
  omitUndefined,
  pickProProps,
  useDeepCompareMemo,
  useRefFunction,
} from '@ant-design/pro-utils';
import defaultRenderText from './defaultRenderText';

const ProFieldComponent: React.ForwardRefRenderFunction<
  any,
  ProFieldPropsType
> = (
  {
    text,
    valueType = 'text',
    mode = 'read',
    onChange,
    renderFormItem,
    value,
    readonly,
    fieldProps: restFieldProps,
    ...rest
  },
  ref: any,
) => {
  const context = useContext(ProConfigContext);

  const onChangeCallBack = useRefFunction((...restParams: any[]) => {
    restFieldProps?.onChange?.(...restParams);
    onChange?.(...restParams);
  });

  const fieldProps: any = useDeepCompareMemo(() => {
    return (
      (value !== undefined || restFieldProps) && {
        value,
        // fieldProps 优先级更高，在类似 LightFilter 场景下需要覆盖默认的 value 和 onChange
        ...omitUndefined(restFieldProps),
        onChange: onChangeCallBack,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, restFieldProps, onChangeCallBack]);

  const renderedDom = defaultRenderText(
    mode === 'edit'
      ? fieldProps?.value ?? text ?? ''
      : text ?? fieldProps?.value ?? '',
    valueType || 'text',
    omitUndefined({
      ref,
      ...rest,
      mode: readonly ? 'read' : mode,
      renderFormItem: renderFormItem
        ? (curText: any, props: ProFieldFCRenderProps, dom: JSX.Element) => {
            const { placeholder: _placeholder, ...restProps } = props;
            const newDom = renderFormItem(curText, restProps, dom);
            // renderFormItem 之后的dom可能没有props，这里会帮忙注入一下
            if (React.isValidElement(newDom))
              return React.cloneElement(newDom, {
                ...fieldProps,
                ...((newDom.props as any) || {}),
              });
            return newDom;
          }
        : undefined,
      placeholder: renderFormItem
        ? undefined
        : rest?.placeholder ?? fieldProps?.placeholder,
      fieldProps: pickProProps(
        omitUndefined({
          ...fieldProps,
          placeholder: renderFormItem
            ? undefined
            : rest?.placeholder ?? fieldProps?.placeholder,
        }),
      ),
    }),
    context.valueTypeMap || {},
  );

  return <React.Fragment>{renderedDom}</React.Fragment>;
};

export const ProField = React.forwardRef(
  ProFieldComponent,
) as typeof ProFieldComponent;

export default ProField;
