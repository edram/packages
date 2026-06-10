import { expectTypeOf } from 'vitest';
import { renderHook } from '@testing-library/react';
import useUrlState, { parseAsInteger } from '../src/useUrlState';

// 类型测试：本文件只参与 vitest typecheck（tsc），不会真正执行。
describe('useUrlState 类型', () => {
  it('无 parsers：state 值为 string | string[]（noUncheckedIndexedAccess 下索引访问含 undefined）', () => {
    const { result } = renderHook(() => useUrlState());

    const [state] = result.current;

    expectTypeOf(state.a).toEqualTypeOf<string | string[] | undefined>();
  });

  it('声明 parser 的 key：解析失败 → null，url 缺失 → undefined；未声明 key 不受 parsers 影响', () => {
    const { result } = renderHook(() =>
      useUrlState({
        parsers: { a: parseAsInteger },
      }),
    );

    const [state] = result.current;

    expectTypeOf(state.a).toEqualTypeOf<number | null | undefined>();

    expectTypeOf(state.b).toEqualTypeOf<string | string[] | undefined>();
  });
});
