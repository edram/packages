import React from 'react';

import { defaultRenderText as _defaultRenderText } from '@ant-design/pro-field';
import FieldHOC from '@ant-design/pro-field/lib/FieldHOC';
import type { ProRenderFieldPropsType } from '@ant-design/pro-provider';
import type {
  ProFieldTextType,
  ProFieldValueObjectType,
  ProFieldValueType,
} from '@ant-design/pro-utils';
import FieldSelect from './components/Select';

type RenderProps = Parameters<typeof _defaultRenderText>['2'];

const defaultRenderText = (
  dataValue: ProFieldTextType,
  valueType: ProFieldValueType | ProFieldValueObjectType,
  props: RenderProps,
  valueTypeMap: Record<string, ProRenderFieldPropsType>,
): React.ReactNode => {
  const { mode = 'read', emptyText = '-' } = props;

  if (
    emptyText !== false &&
    mode === 'read' &&
    valueType !== 'option' &&
    valueType !== 'switch'
  ) {
    if (
      typeof dataValue !== 'boolean' &&
      typeof dataValue !== 'number' &&
      !dataValue
    ) {
      const { fieldProps, render } = props;
      if (render) {
        return render(dataValue, { mode, ...fieldProps }, <>{emptyText}</>);
      }
      return <>{emptyText}</>;
    }
  }

  /** 自定义 */
  if (
    valueType === 'select' ||
    (valueType === 'text' && (props.valueEnum || props.request))
  ) {
    return (
      <FieldHOC isLight={props.light}>
        <FieldSelect text={dataValue as string} {...props} />
      </FieldHOC>
    );
  }

  return _defaultRenderText(dataValue, valueType, props, valueTypeMap);
};

export default defaultRenderText;
