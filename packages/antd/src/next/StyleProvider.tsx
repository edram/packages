'use client';

import type { FC } from 'react';
import React, { useRef, useState } from 'react';
import type { StyleProviderProps as AntdStyleProviderProps } from '@ant-design/cssinjs';
import {
  createCache,
  extractStyle,
  StyleProvider as AntdStyleProvider,
} from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';

type StyleProviderProps = Omit<AntdStyleProviderProps, 'cache'>;

const StyleProvider: FC<StyleProviderProps> = (props) => {
  const [cache] = useState(() => createCache());
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    const styleText = extractStyle(cache, { plain: true });

    if (inserted.current) {
      return null;
    }
    inserted.current = true;

    return (
      <style
        id="antd-cssinjs"
        // to make sure this style is inserted before Ant Design's style generated by client
        data-rc-order="prepend"
        data-rc-priority="-1000"
        dangerouslySetInnerHTML={{ __html: styleText }}
      />
    );
  });

  return <AntdStyleProvider {...props} cache={cache} />;
};

export default StyleProvider;
