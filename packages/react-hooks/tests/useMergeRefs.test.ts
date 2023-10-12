import { renderHook } from '@testing-library/react-hooks';
import { MutableRefObject, createRef } from 'react';
import { useMergedRefs } from '../src/useMergeRefs';

describe('useMergeRefs', () => {
  it('多个 ref 可以同时初始化相同值', () => {
    const ref1 = createRef() as MutableRefObject<number>;
    const ref2 = createRef() as MutableRefObject<number>;

    const { result } = renderHook(() => {
      return useMergedRefs(ref1, ref2);
    });

    const setRef = result.current;

    expect(ref1.current).toBe(null);
    expect(ref2.current).toBe(null);

    setRef(1);
    expect(ref1.current).toBe(1);
    expect(ref2.current).toBe(1);

    setRef(10);
    expect(ref1.current).toBe(10);
    expect(ref2.current).toBe(10);

    ref1.current = 4;
    expect(ref1.current).toBe(4);
    expect(ref2.current).toBe(10);
  });
});
