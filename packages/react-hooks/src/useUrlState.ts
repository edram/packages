import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

export type UrlSearchParams = Record<string, string | string[]>;

const URL_STATE_EVENT = 'edram:urlstatechange';

function defaultParse(search: string): UrlSearchParams {
  const params = new URLSearchParams(search);
  const result: UrlSearchParams = {};
  for (const key of params.keys()) {
    if (key in result) {
      continue;
    }
    const all = params.getAll(key);
    result[key] = all.length > 1 ? all : all[0];
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

export interface UseUrlStateOptions {
  /** 初始值，仅在 url 中缺失对应 key 时兜底，不会主动写回 url */
  defaultSearchParams?: UrlSearchParams;
  /** 受控值。传入则代表受控，state 直接取该值，setState 仅触发 onChange */
  searchParams?: UrlSearchParams;
  /** 状态变化回调。searchParams = 新的对象值，search = 序列化后的 querystring */
  onChange?: (searchParams: UrlSearchParams, search: string) => void;
  /** querystring 字符串 → 状态对象，默认基于 URLSearchParams */
  parse?: (search: string) => UrlSearchParams;
  /** 状态对象 → querystring 字符串，默认基于 URLSearchParams */
  stringify?: (state: UrlSearchParams) => string;
  /** 写回 url 的方式，默认 'replace'（不污染浏览器历史） */
  navigateMode?: 'push' | 'replace';
}

type SetStateArg =
  | UrlSearchParams
  | ((prev: UrlSearchParams) => UrlSearchParams);
type SetState = (next: SetStateArg) => void;

function useUrlState(options: UseUrlStateOptions = {}): [UrlSearchParams, SetState] {
  const {
    defaultSearchParams,
    searchParams,
    onChange,
    parse = defaultParse,
    stringify = defaultStringify,
    navigateMode = 'replace',
  } = options;
  const isControlled = searchParams !== undefined;

  const defaultsRef = useRef(defaultSearchParams);
  defaultsRef.current = defaultSearchParams;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
    () => ({ ...defaultsRef.current, ...parseRef.current(search) }),
    [search],
  );
  const state = isControlled ? searchParams : uncontrolledState;

  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback<SetState>(
    (next) => {
      const value =
        typeof next === 'function' ? next(stateRef.current) : next;
      const nextSearch = stringifyRef.current(value);
      if (!isControlled) {
        writeUrl(nextSearch, navigateMode);
      }
      onChangeRef.current?.(value, nextSearch);
    },
    [isControlled, navigateMode],
  );

  return [state, setState];
}

export default useUrlState;
