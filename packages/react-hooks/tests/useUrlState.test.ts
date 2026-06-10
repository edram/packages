import { createElement, Fragment, useInsertionEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, renderHook } from '@testing-library/react';
import useUrlState, {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsJson,
} from '../src/useUrlState';

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

  it('值为 null 的 key 从 url 中移除', () => {
    window.history.replaceState(null, '', '/?a=1&b=2');

    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current[1]({ a: null, b: '2' });
    });

    expect(window.location.search).toBe('?b=2');
    expect(result.current[0]).toEqual({ b: '2' });
  });

  it('defaultValue 在 url 为空时兜底，且不主动写入 url', () => {
    const { result } = renderHook(() =>
      useUrlState({ defaultValue: { a: 'x' } }),
    );

    expect(result.current[0]).toEqual({ a: 'x' });
    expect(window.location.search).toBe('');
  });

  it('url 有值时覆盖 defaultValue，缺失项用默认补齐', () => {
    window.history.replaceState(null, '', '/?a=y');

    const { result } = renderHook(() =>
      useUrlState({ defaultValue: { a: 'x', z: 'z' } }),
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
      const [state] = useUrlState({ defaultValue: { a: 'x' } });
      return createElement('div', null, JSON.stringify(state));
    }

    const html = renderToStaticMarkup(createElement(Comp));
    // 引号被 HTML 实体编码，断言解码后的内容
    const decoded = html.replace(/&quot;/g, '"');
    expect(decoded).toContain('{"a":"x"}');
    expect(decoded).not.toContain('"y"');
  });

  describe('parsers 数据格式化', () => {
    it('parseAsInteger：?count=5 → state.count === 5（number）', () => {
      window.history.replaceState(null, '', '/?count=5');

      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger } }),
      );

      expect(result.current[0].count).toBe(5);
    });

    it('未声明 parser 的 key 保持字符串', () => {
      window.history.replaceState(null, '', '/?count=5&name=bob');

      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger } }),
      );

      expect(result.current[0].count).toBe(5);
      expect(result.current[0].name).toBe('bob');
    });

    it('写回走 stringify：setState({ count: 6 }) → ?count=6', () => {
      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger } }),
      );

      act(() => {
        result.current[1]({ count: 6 });
      });

      expect(window.location.search).toBe('?count=6');
      expect(result.current[0].count).toBe(6);
    });

    it('parseAsBoolean / parseAsFloat 读 + 写', () => {
      window.history.replaceState(null, '', '/?active=true&ratio=1.5');

      const { result } = renderHook(() =>
        useUrlState({
          parsers: { active: parseAsBoolean, ratio: parseAsFloat },
        }),
      );

      expect(result.current[0].active).toBe(true);
      expect(result.current[0].ratio).toBe(1.5);

      act(() => {
        result.current[1]({ active: false, ratio: 2.25 });
      });

      expect(window.location.search).toBe('?active=false&ratio=2.25');
    });

    it('parseAsArrayOf(parseAsInteger)：?c=1&c=2 → [1,2]，写 [3,4] → ?c=3&c=4', () => {
      window.history.replaceState(null, '', '/?c=1&c=2');

      const { result } = renderHook(() =>
        useUrlState({ parsers: { c: parseAsArrayOf(parseAsInteger) } }),
      );

      expect(result.current[0].c).toEqual([1, 2]);

      act(() => {
        result.current[1]({ c: [3, 4] });
      });

      expect(window.location.search).toBe('?c=3&c=4');
      expect(result.current[0].c).toEqual([3, 4]);
    });

    it('parseAsJson：读编码 json → 对象，写回 → 编码 json', () => {
      const encoded = encodeURIComponent(JSON.stringify({ a: 1 }));
      window.history.replaceState(null, '', `/?filter=${encoded}`);

      const { result } = renderHook(() =>
        useUrlState({ parsers: { filter: parseAsJson<{ a: number }>() } }),
      );

      expect(result.current[0].filter).toEqual({ a: 1 });

      act(() => {
        result.current[1]({ filter: { a: 2 } });
      });

      expect(result.current[0].filter).toEqual({ a: 2 });
      const sp = new URLSearchParams(window.location.search);
      expect(JSON.parse(sp.get('filter')!)).toEqual({ a: 2 });
    });

    it('非法值 → null：?count=abc → state.count === null', () => {
      window.history.replaceState(null, '', '/?count=abc');

      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger } }),
      );

      expect(result.current[0].count).toBeNull();
    });

    it('函数简写：传函数即当作 parse，写回走默认 stringify', () => {
      window.history.replaceState(null, '', '/?name=bob');

      const { result } = renderHook(() =>
        useUrlState({
          parsers: { name: (v: string | string[]) => String(v).toUpperCase() },
        }),
      );

      expect(result.current[0].name).toBe('BOB');

      act(() => {
        result.current[1]({ name: 'ALICE' });
      });

      expect(window.location.search).toBe('?name=ALICE');
    });

    it('对象只写 parse：写回走默认 stringify（String 强转）', () => {
      window.history.replaceState(null, '', '/?flag=1');

      const { result } = renderHook(() =>
        useUrlState({
          parsers: { flag: { parse: (v: string | string[]) => v === '1' } },
        }),
      );

      expect(result.current[0].flag).toBe(true);

      act(() => {
        result.current[1]({ flag: false });
      });

      expect(window.location.search).toBe('?flag=false');
    });

    it('typed defaultValue 兜底并与 url 合并', () => {
      window.history.replaceState(null, '', '/?count=5');

      const { result } = renderHook(() =>
        useUrlState({
          parsers: { count: parseAsInteger, size: parseAsInteger },
          defaultValue: { count: 0, size: 10 },
        }),
      );

      expect(result.current[0].count).toBe(5);
      expect(result.current[0].size).toBe(10);
    });

    it('函数式更新基于 typed prev', () => {
      window.history.replaceState(null, '', '/?count=5');

      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger } }),
      );

      act(() => {
        result.current[1]((prev) => ({
          ...prev,
          count: (prev.count ?? 0) + 1,
        }));
      });

      expect(result.current[0].count).toBe(6);
      expect(window.location.search).toBe('?count=6');
    });

    it('onChange 第一参数为 typed 值，第二参数为 querystring', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger }, onChange }),
      );

      act(() => {
        result.current[1]({ count: 7 });
      });

      expect(onChange).toHaveBeenCalledWith({ count: 7 }, 'count=7');
    });
  });

  describe('defaultValue / clearOnDefault / withDefault', () => {
    it('clearOnDefault 默认开启：写回值等于默认值的 key 不进 url，state 仍由默认兜底', () => {
      const { result } = renderHook(() =>
        useUrlState({ defaultValue: { a: 'x' } }),
      );

      act(() => {
        result.current[1]({ a: 'x', b: '1' });
      });

      expect(window.location.search).toBe('?b=1');
      expect(result.current[0]).toEqual({ a: 'x', b: '1' });
    });

    it('clearOnDefault: false 时默认值照常写入 url', () => {
      const { result } = renderHook(() =>
        useUrlState({ defaultValue: { a: 'x' }, clearOnDefault: false }),
      );

      act(() => {
        result.current[1]({ a: 'x' });
      });

      expect(window.location.search).toBe('?a=x');
    });

    it('parser.withDefault：url 缺失或解析失败都回退默认值', () => {
      window.history.replaceState(null, '', '/?bad=abc');

      const { result } = renderHook(() =>
        useUrlState({
          parsers: {
            count: parseAsInteger.withDefault(1),
            bad: parseAsInteger.withDefault(7),
          },
        }),
      );

      expect(result.current[0].count).toBe(1);
      expect(result.current[0].bad).toBe(7);
    });

    it('withDefault + clearOnDefault：写默认值清出 url，非默认值正常写入', () => {
      const { result } = renderHook(() =>
        useUrlState({ parsers: { count: parseAsInteger.withDefault(1) } }),
      );

      act(() => {
        result.current[1]({ count: 1 });
      });
      expect(window.location.search).toBe('');
      expect(result.current[0].count).toBe(1);

      act(() => {
        result.current[1]({ count: 2 });
      });
      expect(window.location.search).toBe('?count=2');
    });

    it('defaultValue 选项优先级高于 parser.withDefault', () => {
      const { result } = renderHook(() =>
        useUrlState({
          parsers: { count: parseAsInteger.withDefault(1) },
          defaultValue: { count: 5 },
        }),
      );

      expect(result.current[0].count).toBe(5);
    });
  });

  describe('defaultSearchParams（仅首次渲染生效）', () => {
    it('字符串：首次渲染读 defaultSearchParams，挂载后以真实 url 为准', () => {
      window.history.replaceState(null, '', '/?a=real');

      const states: unknown[] = [];
      const { result } = renderHook(() => {
        const ret = useUrlState({ defaultSearchParams: 'a=initial' });
        states.push(ret[0]);
        return ret;
      });

      expect(states[0]).toEqual({ a: 'initial' });
      expect(result.current[0]).toEqual({ a: 'real' });
    });

    it('支持 URLSearchParams 入参', () => {
      const states: unknown[] = [];
      renderHook(() => {
        const ret = useUrlState({
          defaultSearchParams: new URLSearchParams('b=2'),
        });
        states.push(ret[0]);
        return ret;
      });

      expect(states[0]).toEqual({ b: '2' });
    });

    it('支持对象入参，typed 值经 parsers 序列化再解析', () => {
      const states: Array<Record<string, unknown>> = [];
      renderHook(() => {
        const ret = useUrlState({
          parsers: { count: parseAsInteger },
          defaultSearchParams: { count: 3 },
        });
        states.push(ret[0]);
        return ret;
      });

      expect(states[0]?.count).toBe(3);
    });

    it('与真实 url 一致时挂载后 state 不变', () => {
      window.history.replaceState(null, '', '/?a=1');

      const { result } = renderHook(() =>
        useUrlState({ defaultSearchParams: 'a=1' }),
      );

      expect(result.current[0]).toEqual({ a: '1' });
    });

    it('Next.js App Router 导航时序：渲染期 location 还是旧路由，state 不读旧 querystring', () => {
      // 旧页面：/sample?search=aaa；Next 在新页面 render 完成后才于
      // useInsertionEffect 中 pushState 新 url
      window.history.replaceState(null, '', '/sample?search=aaa');

      function HistoryUpdater() {
        useInsertionEffect(() => {
          window.history.pushState(null, '', '/japan');
        }, []);
        return null;
      }

      const states: unknown[] = [];
      const { result } = renderHook(
        () => {
          const ret = useUrlState({ defaultSearchParams: '' });
          states.push(ret[0]);
          return ret;
        },
        {
          wrapper: ({ children }) =>
            createElement(
              Fragment,
              null,
              children,
              createElement(HistoryUpdater),
            ),
        },
      );

      // 首次渲染没有读到旧路由残留的 search
      expect(states[0]).toEqual({});
      // 挂载后 url 已切到新路由，state 保持干净
      expect(window.location.pathname).toBe('/japan');
      expect(result.current[0]).toEqual({});
    });
  });
});
