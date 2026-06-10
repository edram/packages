import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

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

type NormalizedParser = {
  parse?: ParserFn<any>;
  stringify?: (value: any) => string | string[];
};

const normalizeParser = (input: ParserInput<any>): NormalizedParser =>
  typeof input === 'function' ? { parse: input } : input;

/** 标量 parser 容忍传入数组：取首项。 */
const toScalar = (value: string | string[]): string =>
  Array.isArray(value) ? (value[0] ?? '') : value;

/** 字符串原样透传（数组取首项）。 */
export const parseAsString = {
  parse: (value: string | string[]) => toScalar(value),
  stringify: (value: string) => value,
} satisfies Parser<string>;

/** 整数：parseInt(., 10)，NaN → null；stringify 取整。 */
export const parseAsInteger = {
  parse: (value: string | string[]) => {
    const n = Number.parseInt(toScalar(value), 10);
    return Number.isNaN(n) ? null : n;
  },
  stringify: (value: number) => String(Math.trunc(value)),
} satisfies Parser<number>;

/** 浮点：parseFloat，NaN → null。 */
export const parseAsFloat = {
  parse: (value: string | string[]) => {
    const n = Number.parseFloat(toScalar(value));
    return Number.isNaN(n) ? null : n;
  },
  stringify: (value: number) => String(value),
} satisfies Parser<number>;

/** 布尔：'true' → true，其余 → false；stringify 'true' / 'false'。 */
export const parseAsBoolean = {
  parse: (value: string | string[]) => toScalar(value) === 'true',
  stringify: (value: boolean) => (value ? 'true' : 'false'),
} satisfies Parser<boolean>;

/**
 * 数组：把 `string | string[]` 归一为数组，逐项走 `item.parse`（丢弃解析失败的 null）。
 * stringify 产出 `string[]` → 展开为多值 `?k=a&k=b`，沿用同名 key→数组行为。
 */
export function parseAsArrayOf<T>(item: Parser<T>): Required<Parser<T[]>> {
  return {
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
  };
}

/** 任意 JSON 结构：JSON.parse / JSON.stringify，解析失败 → null。 */
export function parseAsJson<T = unknown>(): Required<Parser<T>> {
  return {
    parse: (value) => {
      try {
        return JSON.parse(toScalar(value)) as T;
      } catch {
        return null;
      }
    },
    stringify: (value) => JSON.stringify(value),
  };
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
      out[key] = parser.parse(value);
    }
  }
  return out;
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

/** state 中各 key 的值类型：由 parse（含函数简写）决定，无 parse 的保持原样。 */
type InferParser<P> = P extends (...args: never[]) => infer R
  ? R | null
  : P extends { parse: (...args: never[]) => infer R }
    ? R | null
    : string | string[];

/** 读取侧 state：声明 parser 的 key 为 typed 值（解析失败 → null，url 缺失 → undefined），未声明的 key 保持 string | string[]（属性访问时声明 key 优先于索引签名）。 */
export type ParsedState<P extends ParserMap> = {
  [K in keyof P]: InferParser<P[K]> | undefined;
} & {
  [key: string]: string | string[];
};

/** 输入侧（defaultSearchParams / searchParams / setState）：索引签名需并入所有 parser 的返回类型，否则对象字面量里的 typed 值过不了索引签名检查。 */
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

export interface UseUrlStateOptions<P extends ParserMap = {}> {
  /** 初始值，仅在 url 中缺失对应 key 时兜底，不会主动写回 url */
  defaultSearchParams?: Partial<StateInput<P>>;
  /** 受控值。传入则代表受控，state 直接取该值，setState 仅触发 onChange */
  searchParams?: StateInput<P>;
  /** 状态变化回调。searchParams = 新的对象值，search = 序列化后的 querystring */
  onChange?: (searchParams: ParsedState<P>, search: string) => void;
  /** 按 key 配置的值解析器；声明的 key 在 state 里为 typed 值，未声明的保持 string | string[] */
  parsers?: P;
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

function useUrlState<P extends ParserMap = {}>(
  options: UseUrlStateOptions<P> = {},
): [ParsedState<P>, SetState<ParsedState<P>, StateInput<P>>] {
  const {
    defaultSearchParams,
    searchParams,
    onChange,
    parsers,
    parse = defaultParse,
    stringify = defaultStringify,
    navigateMode = 'replace',
  } = options;
  const isControlled = searchParams !== undefined;

  const defaultsRef = useRef(defaultSearchParams);
  defaultsRef.current = defaultSearchParams;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const parsersRef = useRef(parsers);
  parsersRef.current = parsers;

  const parseRef = useRef(parse);
  parseRef.current = parse;

  const stringifyRef = useRef(stringify);
  stringifyRef.current = stringify;

  const search = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const uncontrolledState = useMemo(
    () =>
      ({
        ...defaultsRef.current,
        ...applyParsers(parseRef.current(search), parsersRef.current),
      }) as ParsedState<P>,
    [search],
  );
  const state = isControlled ? (searchParams as ParsedState<P>) : uncontrolledState;

  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback<SetState<ParsedState<P>, StateInput<P>>>(
    (next) => {
      const value =
        typeof next === 'function'
          ? (
              next as (
                prev: ParsedState<P>,
              ) => NullableState<StateInput<P>>
            )(stateRef.current)
          : next;
      const raw = serializeState(value, parsersRef.current);
      const nextSearch = stringifyRef.current(raw);
      if (!isControlled) {
        writeUrl(nextSearch, navigateMode);
      }
      onChangeRef.current?.(value as ParsedState<P>, nextSearch);
    },
    [isControlled, navigateMode],
  );

  return [state, setState];
}

export default useUrlState;
