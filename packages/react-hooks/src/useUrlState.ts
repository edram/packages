import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
} from 'react';

export type UrlSearchParams = Record<string, string | string[]>;

const URL_STATE_EVENT = 'edram:urlstatechange';

// ---------------------------------------------------------------------------
// parsers：按 key 配置的值解析器
// ---------------------------------------------------------------------------

/**
 * 单个字段的解析器。`parse` / `stringify` 均可选：
 * - 缺 `parse` → 该 key 读取时保持 `string | string[]`；
 * - 缺 `stringify` → 写回时走默认序列化（`String()` 强转 / 数组展开）。
 */
export interface Parser<T> {
  parse?: (value: string | string[]) => T | null;
  stringify?: (value: T) => string | string[];
}

/** 函数简写：直接传函数即被当作 `parse`。 */
export type ParserFn<T> = (value: string | string[]) => T | null;

/** `parsers[key]` 可接受的两种形态。 */
export type ParserInput<T> = ParserFn<T> | Parser<T>;

type ParserMap = Record<string, ParserInput<any>>;

/** 带默认值的 parser：url 缺失或解析失败（null）时回退 defaultValue，state 类型收窄为 T。 */
export interface ParserWithDefault<T> extends Parser<T> {
  defaultValue: T;
}

/** 内置 parser 形态：完整 parse / stringify，外加 withDefault。 */
export interface ParserBuilder<T> extends Required<Parser<T>> {
  /** 附加默认值：url 缺失或解析失败时回退 defaultValue，state 类型收窄为 T。 */
  withDefault: (defaultValue: T) => ParserWithDefault<T>;
}

function createParser<T>(parser: Required<Parser<T>>): ParserBuilder<T> {
  return {
    ...parser,
    withDefault: (defaultValue) => ({ ...parser, defaultValue }),
  };
}

type NormalizedParser = {
  parse?: ParserFn<any>;
  stringify?: (value: any) => string | string[];
  defaultValue?: unknown;
};

const normalizeParser = (input: ParserInput<any>): NormalizedParser =>
  typeof input === 'function' ? { parse: input } : input;

/** 标量 parser 容忍传入数组：取首项。 */
const toScalar = (value: string | string[]): string =>
  Array.isArray(value) ? (value[0] ?? '') : value;

/** 字符串原样透传（数组取首项）。 */
export const parseAsString = createParser<string>({
  parse: (value) => toScalar(value),
  stringify: (value) => value,
});

/** 整数：parseInt(., 10)，NaN → null；stringify 取整。 */
export const parseAsInteger = createParser<number>({
  parse: (value) => {
    const n = Number.parseInt(toScalar(value), 10);
    return Number.isNaN(n) ? null : n;
  },
  stringify: (value) => String(Math.trunc(value)),
});

/** 浮点：parseFloat，NaN → null。 */
export const parseAsFloat = createParser<number>({
  parse: (value) => {
    const n = Number.parseFloat(toScalar(value));
    return Number.isNaN(n) ? null : n;
  },
  stringify: (value) => String(value),
});

/** 布尔：'true' → true，其余 → false；stringify 'true' / 'false'。 */
export const parseAsBoolean = createParser<boolean>({
  parse: (value) => toScalar(value) === 'true',
  stringify: (value) => (value ? 'true' : 'false'),
});

/**
 * 数组：把 `string | string[]` 归一为数组，逐项走 `item.parse`（丢弃解析失败的 null）。
 * stringify 产出 `string[]` → 展开为多值 `?k=a&k=b`，沿用同名 key→数组行为。
 */
export function parseAsArrayOf<T>(item: Parser<T>): ParserBuilder<T[]> {
  return createParser({
    parse: (value) => {
      const list = Array.isArray(value) ? value : [value];
      const out: T[] = [];
      for (const raw of list) {
        const parsed = item.parse?.(raw) ?? null;
        if (parsed !== null) {
          out.push(parsed);
        }
      }
      return out;
    },
    stringify: (value) =>
      value.map((entry) => {
        const s = item.stringify ? item.stringify(entry) : String(entry);
        return Array.isArray(s) ? (s[0] ?? '') : s;
      }),
  });
}

/** 任意 JSON 结构：JSON.parse / JSON.stringify，解析失败 → null。 */
export function parseAsJson<T = unknown>(): ParserBuilder<T> {
  return createParser({
    parse: (value) => {
      try {
        return JSON.parse(toScalar(value)) as T;
      } catch {
        return null;
      }
    },
    stringify: (value) => JSON.stringify(value),
  });
}

/** 对已解析出的 raw 对象按 parsers 逐 key 应用 `parse`（仅对 url 中存在的 key）。 */
function applyParsers(
  raw: UrlSearchParams,
  parsers?: ParserMap,
): Record<string, unknown> {
  if (!parsers) {
    return raw;
  }
  const out: Record<string, unknown> = { ...raw };
  for (const [key, input] of Object.entries(parsers)) {
    const value = raw[key];
    if (value === undefined) {
      continue;
    }
    const parser = normalizeParser(input);
    if (parser.parse) {
      const parsed = parser.parse(value);
      out[key] =
        parsed === null && parser.defaultValue !== undefined
          ? parser.defaultValue
          : parsed;
    }
  }
  return out;
}

/** 汇总默认值：parser.withDefault 在前，defaultValue 选项优先级更高。 */
function collectDefaults(
  defaults?: Record<string, unknown>,
  parsers?: ParserMap,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (parsers) {
    for (const [key, input] of Object.entries(parsers)) {
      const parser = normalizeParser(input);
      if (parser.defaultValue !== undefined) {
        out[key] = parser.defaultValue;
      }
    }
  }
  return { ...out, ...defaults };
}

/** raw 值相等：标量 ===，数组逐项比较。 */
function isSameRaw(a: string | string[], b: string | string[]): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i]);
  }
  return a === b;
}

/** 把 typed state 还原为 raw（声明且有 stringify 的走 stringify，否则原样）。 */
function serializeState(
  state: Record<string, unknown>,
  parsers?: ParserMap,
): UrlSearchParams {
  const raw: UrlSearchParams = {};
  for (const [key, value] of Object.entries(state)) {
    if (value == null) {
      continue;
    }
    const input = parsers?.[key];
    const parser = input === undefined ? undefined : normalizeParser(input);
    raw[key] = parser?.stringify
      ? parser.stringify(value)
      : (value as string | string[]);
  }
  return raw;
}

/** state 中各 key 的值类型：withDefault 收窄为 T；否则由 parse（含函数简写）决定（解析失败 → null），无 parse 的保持原样。 */
type InferParser<P> = P extends { defaultValue: infer T }
  ? T
  : P extends (...args: never[]) => infer R
    ? R | null
    : P extends { parse: (...args: never[]) => infer R }
      ? R | null
      : string | string[];

/**
 * 读取侧 state（属性访问时声明 key 优先于索引签名）：
 * - 声明 parser 的 key 为 typed 值；url 缺失 → undefined，但有默认值
 *   （parser.withDefault 或 defaultValue 选项）兜底时去掉 undefined；
 * - 只出现在 defaultValue 选项里的 key 为 string | string[]（必有）；
 * - 其余 key 保持 string | string[]。
 */
export type ParsedState<
  P extends ParserMap = {},
  D extends Record<string, unknown> = {},
> = {
  [K in keyof P]: P[K] extends { defaultValue: any }
    ? InferParser<P[K]>
    : K extends keyof D
      ? InferParser<P[K]>
      : InferParser<P[K]> | undefined;
} & {
  [K in Exclude<keyof D, keyof P>]: string | string[];
} & {
  [key: string]: string | string[];
};

/** 输入侧（defaultValue / searchParams / setState）：索引签名需并入所有 parser 的返回类型，否则对象字面量里的 typed 值过不了索引签名检查。 */
type StateInput<P extends ParserMap> = {
  [K in keyof P]: InferParser<P[K]> | undefined;
} & {
  [key: string]: string | string[] | InferParser<P[keyof P]>;
};

// ---------------------------------------------------------------------------
// 默认整串 parse / stringify + URL 外部 store
// ---------------------------------------------------------------------------

function defaultParse(search: string): UrlSearchParams {
  const params = new URLSearchParams(search);
  const result: UrlSearchParams = {};
  for (const key of params.keys()) {
    if (key in result) {
      continue;
    }
    const all = params.getAll(key);
    result[key] = all.length > 1 ? all : (all[0] ?? '');
  }
  return result;
}

function defaultStringify(state: UrlSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else {
      params.append(key, value);
    }
  }
  return params.toString();
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('popstate', callback);
  window.addEventListener(URL_STATE_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(URL_STATE_EVENT, callback);
  };
}

function getClientSnapshot(): string {
  return window.location.search;
}

function getServerSnapshot(): string {
  return '';
}

function writeUrl(search: string, navigateMode: 'push' | 'replace'): void {
  if (typeof window === 'undefined') {
    return;
  }
  const { pathname, hash } = window.location;
  const url = `${pathname}${search ? `?${search}` : ''}${hash}`;
  if (navigateMode === 'push') {
    window.history.pushState(null, '', url);
  } else {
    window.history.replaceState(null, '', url);
  }
  window.dispatchEvent(new Event(URL_STATE_EVENT));
}

/** defaultSearchParams 归一为与 location.search 同形态的字符串（非空时带前导 '?'）。 */
function toSearchString(
  input: string | URLSearchParams | Record<string, unknown>,
  parsers: ParserMap | undefined,
  stringify: (state: UrlSearchParams) => string,
): string {
  let search: string;
  if (typeof input === 'string') {
    search = input;
  } else if (input instanceof URLSearchParams) {
    search = input.toString();
  } else {
    search = stringify(serializeState(input, parsers));
  }
  return search === '' || search.startsWith('?') ? search : `?${search}`;
}

export interface UseUrlStateOptions<
  P extends ParserMap = {},
  D extends Partial<StateInput<P>> = {},
> {
  /**
   * 初始 querystring，仅首次渲染生效，挂载后以真实 url 为准。
   * 用于挂载时 window.location 尚未更新的场景（如 Next.js App Router
   * 客户端导航中渲染新页面），可直接传 next/navigation 的 useSearchParams()。
   * 支持 'a=1&b=2' 字符串、URLSearchParams 或与 setState 入参同构的对象。
   */
  defaultSearchParams?: string | URLSearchParams | Partial<StateInput<P>>;
  /** 默认值，仅在 url 中缺失对应 key 时兜底，不会主动写回 url；提供的 key 会反映在 state 类型上（去掉 undefined） */
  defaultValue?: D;
  /** 受控值。传入则代表受控，state 直接取该值，setState 仅触发 onChange */
  searchParams?: StateInput<P>;
  /** 状态变化回调。searchParams = 新的对象值，search = 序列化后的 querystring */
  onChange?: (searchParams: ParsedState<P, D>, search: string) => void;
  /** 按 key 配置的值解析器；声明的 key 在 state 里为 typed 值，未声明的保持 string | string[] */
  parsers?: P;
  /** 写回时值等于默认值（defaultValue 选项或 parser.withDefault）的 key 不写入 url，默认 true */
  clearOnDefault?: boolean;
  /** querystring 字符串 → 状态对象，默认基于 URLSearchParams */
  parse?: (search: string) => UrlSearchParams;
  /** 状态对象 → querystring 字符串，默认基于 URLSearchParams */
  stringify?: (state: UrlSearchParams) => string;
  /** 写回 url 的方式，默认 'replace'（不污染浏览器历史） */
  navigateMode?: 'push' | 'replace';
}

/** setState 入参允许 null / undefined 值，表示删除该 key（序列化时跳过）。 */
type NullableState<S> = { [K in keyof S]: S[K] | null | undefined };

type SetState<S, Input = S> = (
  next: NullableState<Input> | ((prev: S) => NullableState<Input>),
) => void;

function useUrlState<
  P extends ParserMap = {},
  D extends Partial<StateInput<P>> = {},
>(
  options: UseUrlStateOptions<P, D> = {},
): [ParsedState<P, D>, SetState<ParsedState<P, D>, StateInput<P>>] {
  const {
    defaultSearchParams,
    defaultValue,
    searchParams,
    onChange,
    parsers,
    clearOnDefault = true,
    parse = defaultParse,
    stringify = defaultStringify,
    navigateMode = 'replace',
  } = options;
  const isControlled = searchParams !== undefined;

  // defaultSearchParams 仅首次渲染生效：第一次 render 捕获一份，挂载后弃用
  const initializedRef = useRef(false);
  const initialSearchRef = useRef<string | null>(null);
  if (!initializedRef.current) {
    initializedRef.current = true;
    initialSearchRef.current =
      defaultSearchParams === undefined
        ? null
        : toSearchString(defaultSearchParams, parsers, stringify);
  }
  const mountedRef = useRef(false);

  const defaultsRef = useRef(defaultValue);
  defaultsRef.current = defaultValue;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const parsersRef = useRef(parsers);
  parsersRef.current = parsers;

  const parseRef = useRef(parse);
  parseRef.current = parse;

  const stringifyRef = useRef(stringify);
  stringifyRef.current = stringify;

  const storeSearch = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const search =
    !mountedRef.current && initialSearchRef.current !== null
      ? initialSearchRef.current
      : storeSearch;

  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;
    // 切回真实 url：与首次渲染用的 defaultSearchParams 不一致时才需要重渲染
    if (
      initialSearchRef.current !== null &&
      initialSearchRef.current !== getClientSnapshot()
    ) {
      forceUpdate();
    }
  }, []);

  const uncontrolledState = useMemo(
    () =>
      ({
        ...collectDefaults(defaultsRef.current, parsersRef.current),
        ...applyParsers(parseRef.current(search), parsersRef.current),
      }) as ParsedState<P, D>,
    [search],
  );
  const state = isControlled
    ? (searchParams as ParsedState<P, D>)
    : uncontrolledState;

  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback<SetState<ParsedState<P, D>, StateInput<P>>>(
    (next) => {
      const value =
        typeof next === 'function'
          ? (
              next as (
                prev: ParsedState<P, D>,
              ) => NullableState<StateInput<P>>
            )(stateRef.current)
          : next;
      const raw = serializeState(value, parsersRef.current);
      if (clearOnDefault) {
        const defaultsRaw = serializeState(
          collectDefaults(defaultsRef.current, parsersRef.current),
          parsersRef.current,
        );
        for (const [key, def] of Object.entries(defaultsRaw)) {
          const current = raw[key];
          if (current !== undefined && isSameRaw(current, def)) {
            delete raw[key];
          }
        }
      }
      const nextSearch = stringifyRef.current(raw);
      if (!isControlled) {
        writeUrl(nextSearch, navigateMode);
      }
      onChangeRef.current?.(value as ParsedState<P, D>, nextSearch);
    },
    [isControlled, navigateMode, clearOnDefault],
  );

  return [state, setState];
}

export default useUrlState;
