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

  it('defaultValue 提供的 key 去掉 undefined（必有），未提供的不受影响', () => {
    const { result } = renderHook(() =>
      useUrlState({ defaultValue: { a: 'x' } }),
    );

    const [state] = result.current;

    expectTypeOf(state.a).toEqualTypeOf<string | string[]>();

    expectTypeOf(state.b).toEqualTypeOf<string | string[] | undefined>();
  });

  it('parser.withDefault：key 收窄为 T（无 null / undefined）', () => {
    const { result } = renderHook(() =>
      useUrlState({
        parsers: { a: parseAsInteger.withDefault(1) },
      }),
    );

    const [state] = result.current;

    expectTypeOf(state.a).toEqualTypeOf<number>();
  });

  it('defaultSearchParams 接受字符串 / URLSearchParams / 与 setState 同构的对象', () => {
    renderHook(() => useUrlState({ defaultSearchParams: 'a=1' }));
    renderHook(() =>
      useUrlState({ defaultSearchParams: new URLSearchParams('a=1') }),
    );
    renderHook(() =>
      useUrlState({
        parsers: { count: parseAsInteger },
        defaultSearchParams: { count: 3 },
      }),
    );
  });

  it('parsers + defaultValue 选项：去掉 undefined，保留 null（解析失败）', () => {
    const { result } = renderHook(() =>
      useUrlState({
        parsers: { a: parseAsInteger },
        defaultValue: { a: 0 },
      }),
    );

    const [state] = result.current;

    expectTypeOf(state.a).toEqualTypeOf<number | null>();
  });
});
