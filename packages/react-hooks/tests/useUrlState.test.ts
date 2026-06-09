import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, renderHook } from '@testing-library/react';
import useUrlState from '../src/useUrlState';

describe('useUrlState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('从 querystring 读取初始 state', () => {
    window.history.replaceState(null, '', '/?a=a&b=b');

    const { result } = renderHook(() => useUrlState());

    const [state] = result.current;
    expect(state).toEqual({ a: 'a', b: 'b' });
  });

  it('setState 把值写回 url 并同步 state', () => {
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current[1]({ a: '1' });
    });

    expect(window.location.search).toBe('?a=1');
    expect(result.current[0]).toEqual({ a: '1' });
  });

  it('默认 navigateMode 为 replace，不新增历史记录', () => {
    const { result } = renderHook(() => useUrlState());
    const before = window.history.length;

    act(() => {
      result.current[1]({ a: '1' });
    });
    act(() => {
      result.current[1]({ a: '2' });
    });

    expect(window.history.length).toBe(before);
  });

  it("navigateMode 为 'push' 时新增历史记录", () => {
    const { result } = renderHook(() =>
      useUrlState({ navigateMode: 'push' }),
    );
    const before = window.history.length;

    act(() => {
      result.current[1]({ a: '1' });
    });

    expect(window.history.length).toBe(before + 1);
    expect(window.location.search).toBe('?a=1');
  });

  it('同名 key 解析为数组，数组写回为多值', () => {
    window.history.replaceState(null, '', '/?c=1&c=2');

    const { result } = renderHook(() => useUrlState());
    expect(result.current[0]).toEqual({ c: ['1', '2'] });

    act(() => {
      result.current[1]({ c: ['3', '4'] });
    });

    expect(window.location.search).toBe('?c=3&c=4');
    expect(result.current[0]).toEqual({ c: ['3', '4'] });
  });

  it('setState 支持函数式更新，基于最新值合并', () => {
    window.history.replaceState(null, '', '/?a=a');

    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current[1]((prev) => ({ ...prev, b: '2' }));
    });

    expect(result.current[0]).toEqual({ a: 'a', b: '2' });
    expect(window.location.search).toBe('?a=a&b=2');
  });

  it('defaultSearchParams 在 url 为空时兜底，且不主动写入 url', () => {
    const { result } = renderHook(() =>
      useUrlState({ defaultSearchParams: { a: 'x' } }),
    );

    expect(result.current[0]).toEqual({ a: 'x' });
    expect(window.location.search).toBe('');
  });

  it('url 有值时覆盖 defaultSearchParams，缺失项用默认补齐', () => {
    window.history.replaceState(null, '', '/?a=y');

    const { result } = renderHook(() =>
      useUrlState({ defaultSearchParams: { a: 'x', z: 'z' } }),
    );

    expect(result.current[0]).toEqual({ a: 'y', z: 'z' });
  });

  it('响应浏览器前进/后退（popstate）', () => {
    const { result } = renderHook(() => useUrlState());

    act(() => {
      window.history.pushState(null, '', '/?x=1');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current[0]).toEqual({ x: '1' });
  });

  it('受控模式下 state 跟随 searchParams prop', () => {
    const { result, rerender } = renderHook(
      ({ sp }) => useUrlState({ searchParams: sp }),
      { initialProps: { sp: { a: '1' } as Record<string, string> } },
    );

    expect(result.current[0]).toEqual({ a: '1' });

    rerender({ sp: { a: '2' } });
    expect(result.current[0]).toEqual({ a: '2' });
    // 受控：不依赖 url
    expect(window.location.search).toBe('');
  });

  it('onChange 回调参数为 (对象值, querystring 字符串)', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useUrlState({ onChange }));

    act(() => {
      result.current[1]({ a: '1', b: '2' });
    });

    expect(onChange).toHaveBeenCalledWith({ a: '1', b: '2' }, 'a=1&b=2');
  });

  it('受控模式下 setState 触发 onChange 但不写 url', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useUrlState({ searchParams: { a: '1' }, onChange }),
    );

    act(() => {
      result.current[1]({ a: '9' });
    });

    expect(onChange).toHaveBeenCalledWith({ a: '9' }, 'a=9');
    expect(window.location.search).toBe('');
  });

  it('支持自定义 parse / stringify', () => {
    window.history.replaceState(null, '', '/?a=1');

    const parse = vi.fn((search: string) => ({ raw: search }));
    const stringify = vi.fn(
      (state: Record<string, string | string[]>) =>
        `keys=${Object.keys(state).join(',')}`,
    );

    const { result } = renderHook(() => useUrlState({ parse, stringify }));

    // 读取走自定义 parse
    expect(parse).toHaveBeenCalled();
    expect(result.current[0]).toEqual({ raw: '?a=1' });

    // 写入走自定义 stringify
    act(() => {
      result.current[1]({ x: '1', y: '2' });
    });

    expect(stringify).toHaveBeenCalledWith({ x: '1', y: '2' });
    expect(window.location.search).toBe('?keys=x,y');
  });

  it('server safe：SSR 渲染走 getServerSnapshot，返回默认值且不读 url', () => {
    // 即使 url 上有值，SSR 也只取默认值（证明走 getServerSnapshot 而非 location）
    window.history.replaceState(null, '', '/?a=y');

    function Comp() {
      const [state] = useUrlState({ defaultSearchParams: { a: 'x' } });
      return createElement('div', null, JSON.stringify(state));
    }

    const html = renderToStaticMarkup(createElement(Comp));
    // 引号被 HTML 实体编码，断言解码后的内容
    const decoded = html.replace(/&quot;/g, '"');
    expect(decoded).toContain('{"a":"x"}');
    expect(decoded).not.toContain('"y"');
  });
});
