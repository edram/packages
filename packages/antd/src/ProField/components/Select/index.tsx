import type { ProFieldFC } from '@ant-design/pro-field';
import {
  useFieldFetchData,
  type FieldSelectProps,
} from '@ant-design/pro-field/es/components/Select';
import type { SelectProps } from '../../../Select';
import {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useIntl, useStyle } from '@ant-design/pro-provider';
import { ConfigProvider, Spin } from 'antd';
import React from 'react';
import type { ProSchemaValueEnumObj } from '@ant-design/pro-utils';
import { objectToMap, proFieldParsingText } from '@ant-design/pro-utils';
import LightSelect from '@ant-design/pro-field/lib/components/Select/LightSelect';
import SearchSelect from './SearchSelect';

const Highlight: React.FC<{
  label: string;
  words: string[];
}> = ({ label, words }) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const lightCls = getPrefixCls('pro-select-item-option-content-light');
  const optionCls = getPrefixCls('pro-select-item-option-content');

  // css
  const { wrapSSR } = useStyle('Highlight', (token) => {
    return {
      [`.${lightCls}`]: {
        color: token.colorPrimary,
      },
      [`.${optionCls}`]: {
        flex: 'auto',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },
    };
  });

  const matchKeywordsRE = new RegExp(
    words
      .map((word) => word.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'))
      .join('|'),
    'gi',
  );

  let matchText = label;

  const elements: React.ReactNode[] = [];

  while (matchText.length) {
    const match = matchKeywordsRE.exec(matchText);
    if (!match) {
      elements.push(matchText);
      break;
    }

    const start = match.index;
    const matchLength = match[0].length + start;

    elements.push(
      matchText.slice(0, start),
      React.createElement(
        'span',
        {
          className: lightCls,
        },
        matchText.slice(start, matchLength),
      ),
    );
    matchText = matchText.slice(matchLength);
  }

  return wrapSSR(
    React.createElement(
      'div',
      {
        title: label,
        className: optionCls,
      },
      ...elements,
    ),
  );
};

/**
 * 可以根据 valueEnum 来进行类型的设置
 *
 * @param
 */
const FieldSelect: ProFieldFC<
  FieldSelectProps & Pick<SelectProps, 'fieldNames' | 'style' | 'className'>
> = (props, ref) => {
  const {
    mode,
    valueEnum,
    render,
    renderFormItem,
    request,
    fieldProps,
    plain,
    children,
    light,
    proFieldKey,
    params,
    label,
    bordered,
    id,
    lightLabel,
    labelTrigger,
    ...rest
  } = props;

  const inputRef = useRef();
  const intl = useIntl();
  const keyWordsRef = useRef<string>('');
  const { fieldNames } = fieldProps;

  useEffect(() => {
    keyWordsRef.current = fieldProps?.searchValue;
  }, [fieldProps?.searchValue]);

  const [loading, options, fetchData, resetData] = useFieldFetchData(props);
  const { componentSize } = ConfigProvider?.useConfig?.() || {
    componentSize: 'middle',
  };
  useImperativeHandle(
    ref,
    () => ({
      ...(inputRef.current || {}),
      fetchData: (keyWord: string) => fetchData(keyWord),
    }),
    [fetchData],
  );

  const optionsValueEnum = useMemo(() => {
    if (mode !== 'read') return;

    const {
      label: labelPropsName = 'label',
      value: valuePropsName = 'value',
      options: optionsPropsName = 'options',
    } = fieldNames || {};

    const valuesMap = new Map();

    const traverseOptions = (_options: typeof options) => {
      if (!_options?.length) {
        return valuesMap;
      }
      const length = _options.length;
      let i = 0;
      while (i < length) {
        const cur = _options[i++];
        valuesMap.set(cur[valuePropsName], cur[labelPropsName]);
        traverseOptions(cur[optionsPropsName]);
      }
      return valuesMap;
    };

    return traverseOptions(options);
  }, [fieldNames, mode, options]);

  if (mode === 'read') {
    const dom = (
      <>
        {proFieldParsingText(
          rest.text,
          objectToMap(
            valueEnum || optionsValueEnum,
          ) as unknown as ProSchemaValueEnumObj,
        )}
      </>
    );

    if (render) {
      return render(dom, { mode, ...fieldProps }, dom) ?? null;
    }
    return dom;
  }

  if (mode === 'edit' || mode === 'update') {
    const renderDom = () => {
      if (light) {
        return (
          <LightSelect
            bordered={bordered}
            id={id}
            loading={loading}
            ref={inputRef}
            allowClear
            size={componentSize}
            options={options}
            label={label}
            placeholder={intl.getMessage(
              'tableForm.selectPlaceholder',
              '请选择',
            )}
            lightLabel={lightLabel}
            labelTrigger={labelTrigger}
            {...fieldProps}
          />
        );
      }
      return (
        <SearchSelect
          key="SearchSelect"
          className={rest.className}
          style={{
            minWidth: 100,
            ...rest.style,
          }}
          bordered={bordered}
          id={id}
          loading={loading}
          ref={inputRef}
          allowClear
          defaultSearchValue={props.defaultKeyWords}
          notFoundContent={
            loading ? <Spin size="small" /> : fieldProps?.notFoundContent
          }
          fetchData={(keyWord) => {
            keyWordsRef.current = keyWord ?? '';
            fetchData(keyWord);
          }}
          resetData={resetData}
          optionItemRender={(item) => {
            if (typeof item.label === 'string' && keyWordsRef.current) {
              return (
                <Highlight label={item.label} words={[keyWordsRef.current]} />
              );
            }
            return item.label;
          }}
          placeholder={intl.getMessage('tableForm.selectPlaceholder', '请选择')}
          label={label}
          {...fieldProps}
          options={options}
        />
      );
    };
    const dom = renderDom();
    if (renderFormItem) {
      return (
        renderFormItem(
          rest.text,
          { mode, ...fieldProps, options, loading },
          dom,
        ) ?? null
      );
    }
    return dom;
  }
  return null;
};

export default React.forwardRef(FieldSelect);
