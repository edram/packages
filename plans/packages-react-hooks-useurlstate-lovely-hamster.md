# 新增 `useUrlState` hook

## Context

`@edram/react-hooks` 目前没有任何处理 URL / querystring 的 hook。业务中常见需求：**动态表单**把整份表单值同步到 URL（`form={a:'a', b:'b}` → `?a=a&b=b`），刷新/分享链接可还原表单状态。

社区方案（`nuqs`、`use-query-params`）都要求**预先声明 key 或整个对象 schema**。本 hook 的核心差异是：**不需要 schema，动态解析整份 querystring**，把它当作一个普通对象来读写。

约束：升级到 React **18/19**（按用户要求放弃 16/17 兼容），因此采用 React 18+ 的 **`useSyncExternalStore`** 把 URL 当作外部 store 订阅——这是处理外部可变源（浏览器历史/地址栏）且**天然 hydration-safe**（提供 `getServerSnapshot`）的官方推荐方式，省去手写 `useState`+`popstate` 同步。querystring 解析零新增运行时依赖（原生 `URLSearchParams`）。

## API 设计

```ts
// 默认 state 形态：动态解析整份 querystring
export type UrlSearchParams = Record<string, string | string[]>;

export interface UseUrlStateOptions<S = UrlSearchParams> {
  /** 初始值，仅首次渲染（非受控）生效，默认 undefined */
  defaultSearchParams?: S;
  /** 受控值。传入则代表受控，默认 undefined（内部自行维护） */
  searchParams?: S;
  /** 状态变化回调。searchParams = 新的对象值，search = 序列化后的 querystring */
  onChange?: (searchParams: S, search: string) => void;
  /** 写回 URL 的方式，默认 'replace'（不污染浏览器历史） */
  navigateMode?: 'push' | 'replace';
  /** querystring 字符串 → 状态对象，默认基于 URLSearchParams */
  parse?: (search: string) => S;
  /** 状态对象 → querystring 字符串，默认基于 URLSearchParams */
  stringify?: (state: S) => string;
}

// 返回值：tuple，与包内 useCopyToClipboard 风格一致
function useUrlState<S = UrlSearchParams>(
  options?: UseUrlStateOptions<S>,
): [S, (next: S | ((prev: S) => S)) => void];
```

要点：
- 返回 `[state, setState]`，`state` 为解析后的对象，`setState` 支持**函数式更新**（`setState(prev => ...)`）。
- **受控 / 非受控**：`searchParams !== undefined` 时为受控，`state` 直接取 `searchParams`，`setState` 只触发 `onChange`，由父级更新 prop；非受控时内部 `useState` 维护。
- 命名取舍：`onChange` 第一个参数沿用对象形态 `S`（与 prop `searchParams`、返回 `state` 同构），第二个参数为序列化后的 `search` 字符串。spec 中的"state"在本实现里对应该 `search` 字符串。

## 实现目标设计（`src/useUrlState.ts`，作为 TDD 的落点参考，非一次性写完）

> 开发以 **TDD 红-绿-重构、垂直切片**推进（见下方「开发流程」）：每个行为先写**一个**失败测试，再写**最小**实现使其通过，下一个行为再循环。以下设计是各切片最终汇聚的形态，不是先整体实现的清单。

参考包内风格：`export default` + tuple 返回、`useCallback` 稳定回调（见 `src/useCopyToClipboard.ts`、`src/useClickAway.ts`）。

1. **默认 parse / stringify（模块内私有函数）**
   - `defaultParse(search)`: `new URLSearchParams(search)`，遍历 key；同名 key 多值用 `getAll` 收成数组，单值为 string。
   - `defaultStringify(state)`: 遍历 entries，`null/undefined` 跳过，数组用 `append` 展开，其余 `append(k, v)`，返回 `params.toString()`。

2. **URL 外部 store（模块级，跨 hook 实例共享）**
   - `getClientSnapshot()`: 返回 `window.location.search`（**稳定的字符串原语**——满足 `useSyncExternalStore` 对 snapshot 缓存的要求，避免每次返回新对象造成死循环）。
   - `getServerSnapshot()`: 返回 `''`（SSR 不触碰 `window`，hydration 由 `useSyncExternalStore` 自动对齐）。
   - `subscribe(cb)`: 监听 `popstate` **以及**自定义事件 `'edram:urlstatechange'`（`history.pushState/replaceState` 不会触发 `popstate`，故自写回时手动 `dispatchEvent`），返回 cleanup 移除两个监听。

3. **读取**
   ```ts
   const isControlled = options.searchParams !== undefined;
   const search = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
   // parse 用 latest-ref 读取，依赖只放 search，保证 snapshot 字符串变化才重算
   const parsed = useMemo(() => ({ ...defaults, ...parseRef.current(search) }), [search]);
   const state = isControlled ? options.searchParams! : parsed;
   ```
   - defaults **不主动写回 URL**（与 nuqs 一致），仅作初始读取兜底。SSR 下 `search=''` → `state` 退化为 `defaults`。

4. **写回 URL（私有 helper，含 `typeof window` 守卫）**
   ```ts
   const url = `${location.pathname}${search ? '?' + search : ''}${location.hash}`;
   navigateMode === 'push'
     ? history.pushState(null, '', url)
     : history.replaceState(null, '', url);
   window.dispatchEvent(new Event('edram:urlstatechange')); // 通知 store 订阅者重读
   ```

5. **`setState`**（`useCallback`，依赖稳定）
   - 解析函数式入参：`const value = typeof next === 'function' ? next(stateRef.current) : next`（用 `stateRef` 持有最新 `state`）。
   - `const search = stringifyRef.current(value)`。
   - 非受控：写回 URL（触发上面的 store 通知，驱动重渲染，无需本地 `useState`）。
   - 始终：`onChangeRef.current?.(value, search)`。受控模式只回调，由父级更新 prop。

6. **稳定性**：`parse`/`stringify`/`onChange`/`navigateMode`/`defaultSearchParams`/`state` 经 `useRef` 镜像为 latest ref，使 `setState`、`subscribe` 依赖数组保持空/稳定，避免每渲染重建订阅。

## 依赖升级（`package.json`）

`useSyncExternalStore` 需要 React 18+；且 `@testing-library/react-hooks` 已停止维护、**不支持 React 18+**（其 `renderHook` 已并入 `@testing-library/react` v13.1+）。改动：

- `peerDependencies`: `react` / `react-dom` → `^18.0.0 || ^19.0.0`。
- `devDependencies`: `react` / `react-dom` → `^19`（最新）；`@types/react` `^17` → `^19`；新增 `react-dom` 的类型若需要 `@types/react-dom@^19`。
- 移除 `@testing-library/react-hooks`，新增 `@testing-library/react@^16`（提供 `renderHook` + `act`，适配 React 18/19）。
- 迁移已有测试 `tests/useCopyToClipboard.test.ts`、`tests/useClickAway.test.ts`（及其它）从 `@testing-library/react-hooks` 改 import 为 `@testing-library/react`（API 基本一致：`renderHook` / `act` / `result.current`）。这是升级的必要连带改动。
- 安装：`pnpm install`（workspace 根或包目录）。

## 导出注册（`src/index.ts`）

追加：
```ts
export { default as useUrlState } from './useUrlState';
export * from './useUrlState';   // 导出 UrlSearchParams / UseUrlStateOptions 类型
```

## 开发流程（TDD 红-绿-重构）

测试文件 `tests/useUrlState.test.ts`，用 `@testing-library/react` 的 `renderHook` + `act`，jsdom 环境（`vitest.config.ts` 已配 `environment: 'jsdom'`），描述用中文。每个 case `beforeEach` 用 `window.history.replaceState(null,'','/')` 重置 URL。

**垂直切片，一次只推进一个行为**：写一个失败测试（RED）→ 写最小实现使其通过（GREEN）→ 必要时重构（REFACTOR，仅在全绿时）。下面是切片顺序，每行 = 一个 红→绿 循环，后一个测试基于前一个学到的东西继续：

1. **tracer bullet — 读取**：预置 `?a=a&b=b`，hook 返回 `[state, setState]`，`state` 为 `{a:'a', b:'b'}`。（落点：`useSyncExternalStore` + `defaultParse` 雏形）
2. **写入**：`setState({a:'1'})` 后 `window.location.search === '?a=1'` 且 `state` 同步更新。（落点：`setState` + 写回 URL + 自定义事件通知 store）
3. **navigateMode 默认 replace**：连续 `setState` 时 `history.length` 不增长。
4. **navigateMode: 'push'**：`setState` 新增一条历史，断言 `history.length` 增长。
5. **同名 key → 数组**：`?c=1&c=2` 解析为 `{c:['1','2']}`；写入 `{c:['1','2']}` 序列化回多值。
6. **函数式更新**：`setState(prev => ({...prev, b:'2'}))` 正确基于最新值合并。
7. **defaultSearchParams**：URL 为空时 `state` 取默认值且 URL **不被主动写入**；URL 有值时覆盖默认。
8. **前进后退（popstate）**：`history.pushState` 改 URL 后 `dispatchEvent(new PopStateEvent('popstate'))`，非受控 `state` 更新。
9. **受控 searchParams**：传入 `searchParams` 时 `state` 跟随 prop 变化；`setState` 触发 `onChange` 而不改内部 store 来源（断言由父级控制）。
10. **onChange 回调**：参数为 `(对象值 S, querystring 字符串)`，在受控/非受控下都触发。
11. **自定义 parse/stringify**：传入自定义序列化器，验证读写都走它而非默认。
12. **server-safe**：断言 `getServerSnapshot` 路径返回 `defaults`、实现中无渲染期裸读 `window`（可通过仅依赖 `getServerSnapshot` 的单元断言或 hydrate 测试覆盖）。

**重构阶段**（全绿后）：抽取 `defaultParse`/`defaultStringify`/store helper 的重复；把 window 守卫与事件名收敛为模块级常量；确认各 ref 镜像让 `setState`/`subscribe` 依赖稳定。每步重构后重跑测试保持绿。

## 验证步骤

TDD 过程中持续 `pnpm test --watch`（或每个切片跑一次 `pnpm test`）确认红→绿。全部完成后：

```bash
cd /Users/edram/Workspaces/packages/packages/react-hooks
pnpm test          # vitest run，新增 useUrlState 测试 + 迁移后的既有测试全绿
pnpm lint          # oxlint src 无报错
pnpm build         # tsdown 产出 ESM+CJS+d.ts，确认 useUrlState 与类型导出
```

## 关键文件

- 新增 `packages/react-hooks/src/useUrlState.ts`（实现）
- 修改 `packages/react-hooks/src/index.ts`（注册导出）
- 新增 `packages/react-hooks/tests/useUrlState.test.ts`（测试）
- 修改 `packages/react-hooks/package.json`（React 18/19 + 测试库升级）
- 连带迁移现有测试 import：`tests/useCopyToClipboard.test.ts`、`tests/useClickAway.test.ts` 等 → `@testing-library/react`
- 参考风格：`src/useCopyToClipboard.ts`（tuple + useCallback）、`src/useUAParser.ts`（默认+具名导出）、`src/useClickAway.ts`（effect + 事件监听 + cleanup）

---

# 增量：新增 per-key `parsers`（数据格式化）

> 上文 `useUrlState` 已实现并合并（react-hooks 现为 `1.0.0`）。本节是其增量功能。

## Context

`useUrlState` 现在把整份 querystring 解析成 `Record<string, string | string[]>`——**所有值都是字符串**。业务里常见诉求是把某些 key 直接拿到**已格式化的类型**：`?count=5` 想要 `state.count === 5`（number）、`?active=true` 想要 boolean、`?ids=1&ids=2` 想要 `number[]`、`?filter={...}` 想要对象。目前调用方拿到 `state` 后得手动 `Number()` / `JSON.parse`，既啰嗦又容易在写回 url 时漏掉反序列化。

参考 `nuqs` 的 `parseAsInteger`、`use-query-params` 的 `NumberParam`，给 `useUrlState` 增加一个**可选、按 key 配置的 `parsers` 映射**：声明了 parser 的 key 在 `state` 里变成 typed 值；未声明的 key 保持 `string | string[]` 原样（动态整份 querystring 的特性不变）。

设计约束（已与用户确认）：
1. 每个 parser 同时承担读（`parse`）与写（`stringify`）两个方向，但**两者都非必填**；命名与 hook 顶层已有的 `parse` / `stringify` 选项保持一致（不再叫 `serialize`）。
2. **支持直接传函数**作为简写：`parsers: { k: fn }` 中 `fn` 即被当作 `parse`（等价于 `{ parse: fn }`）。
3. **内置集合 = 原始类型 + 数组 + JSON**，全部以 `parseAsX` 命名（与 nuqs 一致）并 export 供直接使用；内置项都是同时实现 `parse` + `stringify` 的对象。
4. `parsers` **只改变 `state` 中对应 key 的值**；不在 `parsers` 里的 key 忽略、保持原样。
5. `parsers` 是**可选**参数，不传时行为与现状完全一致（向后兼容）。

## API 设计

### Parser 类型

```ts
// 对象形态：parse / stringify 均可选
export interface Parser<T> {
  /** querystring 原始值 → typed 值；失败返回 null（nuqs 同款约定）。缺省 → 该 key 保持 string | string[] */
  parse?: (value: string | string[]) => T | null;
  /** typed 值 → querystring 字符串（数组多值用 string[]）。缺省 → 写回走默认 stringify（String 强转 / 数组展开） */
  stringify?: (value: T) => string | string[];
}

// 函数简写：直接传函数即当作 parse
type ParserFn<T> = (value: string | string[]) => T | null;

// parsers[key] 可接受的两种形态
export type ParserInput<T> = ParserFn<T> | Parser<T>;

type ParserMap = Record<string, ParserInput<any>>;
```

运行时归一（函数 → `{ parse }`）：

```ts
type NormalizedParser = {
  parse?: ParserFn<any>;
  stringify?: (value: any) => string | string[];
};

const normalizeParser = (input: ParserInput<any>): NormalizedParser =>
  typeof input === 'function' ? { parse: input } : input;
```

### 新增 option（其余 option 不变）

```ts
export interface UseUrlStateOptions<P extends ParserMap = {}> {
  /** 按 key 配置的值解析器；声明的 key 在 state 里为 typed 值，未声明的保持 string | string[] */
  parsers?: P;
  defaultSearchParams?: Partial<ParsedState<P>>;
  searchParams?: ParsedState<P>;
  onChange?: (searchParams: ParsedState<P>, search: string) => void;
  parse?: (search: string) => UrlSearchParams;     // 不变：整串 raw 解析
  stringify?: (state: UrlSearchParams) => string;  // 不变：整串 raw 序列化
  navigateMode?: 'push' | 'replace';
}

function useUrlState<P extends ParserMap = {}>(
  options?: UseUrlStateOptions<P>,
): [
  ParsedState<P>,
  (next: ParsedState<P> | ((prev: ParsedState<P>) => ParsedState<P>)) => void,
];
```

### 类型推断

state 中某个 key 的值类型由其 **`parse`** 决定（函数简写也是 parse）；**只有 `stringify`、没有 `parse`** 的 parser 不改变读取类型，该 key 仍是 `string | string[]`。

```ts
type InferParser<P> =
  P extends ParserFn<infer T> ? T | null                  // ① 函数简写 = parse
  : P extends { parse: ParserFn<infer T> } ? T | null     // ② 对象且含 parse
  : string | string[];                                    // ③ 无 parse（仅 stringify / 空）→ 保持原样

type ParsedState<P extends ParserMap> = {
  [K in keyof P]: InferParser<P[K]>;
} & {
  // index 值并入所有 parser 的返回类型，避免与显式 key 交叉成 never；声明 key 由上面的映射收窄
  [key: string]: string | string[] | InferParser<P[keyof P]>;
};
```

- `P` 默认 `{}` → `ParsedState<{}>` 退化为 `Record<string, string | string[]>`（= 现有 `UrlSearchParams`），**无需 overload、完全向后兼容**。
- `P` 由 `options.parsers` 自动推断：
  - `useUrlState({ parsers: { count: parseAsInteger } })` → `state.count: number | null`
  - `useUrlState({ parsers: { name: (v) => String(v).toUpperCase() } })` → `state.name: string | null`（函数简写）

## 内置 parser（完整实现，写在 `src/useUrlState.ts`，`export *` 自动对外）

> 内置项均为对象形态、同时实现 `parse` + `stringify`。

```ts
// 标量 parser 容忍传入数组：取首项
const toScalar = (value: string | string[]): string =>
  Array.isArray(value) ? (value[0] ?? '') : value;

/** 字符串原样透传（数组取首项） */
export const parseAsString: Parser<string> = {
  parse: (value) => toScalar(value),
  stringify: (value) => value,
};

/** 整数：parseInt(., 10)，NaN → null；stringify 取整 */
export const parseAsInteger: Parser<number> = {
  parse: (value) => {
    const n = Number.parseInt(toScalar(value), 10);
    return Number.isNaN(n) ? null : n;
  },
  stringify: (value) => String(Math.trunc(value)),
};

/** 浮点：parseFloat，NaN → null */
export const parseAsFloat: Parser<number> = {
  parse: (value) => {
    const n = Number.parseFloat(toScalar(value));
    return Number.isNaN(n) ? null : n;
  },
  stringify: (value) => String(value),
};

/** 布尔：'true' → true，其余 → false；stringify 'true' / 'false' */
export const parseAsBoolean: Parser<boolean> = {
  parse: (value) => toScalar(value) === 'true',
  stringify: (value) => (value ? 'true' : 'false'),
};

/**
 * 数组：把 string | string[] 归一为数组，逐项走 item.parse（丢弃解析失败的 null）。
 * stringify 产出 string[] → defaultStringify 展开为多值 ?k=a&k=b，沿用现有同名 key→数组行为。
 */
export function parseAsArrayOf<T>(item: Parser<T>): Parser<T[]> {
  return {
    parse: (value) => {
      const list = Array.isArray(value) ? value : [value];
      const out: T[] = [];
      for (const raw of list) {
        const parsed = item.parse?.(raw) ?? null;
        if (parsed !== null) out.push(parsed);
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

/** 任意 JSON 结构：JSON.parse / JSON.stringify，解析失败 → null。工厂以便携带泛型 */
export function parseAsJson<T = unknown>(): Parser<T> {
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
```

导出清单（用户可直接 `import { parseAsInteger, ... } from '@edram/react-hooks'`）：

| 导出 | 形态 | 读 `parse` | 写 `stringify` |
| --- | --- | --- | --- |
| `parseAsString` | `Parser<string>` | 原样（数组取首项） | 原样 |
| `parseAsInteger` | `Parser<number>` | `parseInt(.,10)`，NaN→`null` | `String(trunc)` |
| `parseAsFloat` | `Parser<number>` | `parseFloat`，NaN→`null` | `String` |
| `parseAsBoolean` | `Parser<boolean>` | `'true'`→`true` | `'true'`/`'false'` |
| `parseAsArrayOf(item)` | `Parser<T[]>` | 多值逐项 `item.parse` | `string[]`（多值） |
| `parseAsJson<T>()` | `Parser<T>` | `JSON.parse`，失败→`null` | `JSON.stringify` |
| `Parser<T>` / `ParserInput<T>` | type | — | — |

## 读 / 写流程接入（`src/useUrlState.ts`）

- 新增 `parsersRef`（latest-ref，保持 `setState` / `useMemo` 依赖稳定，与现有 `parseRef` / `defaultsRef` 一致）。
- **读**（在现有 `useMemo(..., [search])` 内）：`defaultParse`（或自定义 `parse`）得到 raw 后，经 `applyParsers(raw, parsers)`——对 `parsers` 中存在、raw 里有、且归一后**有 `parse`** 的 key 调用其 `parse` 覆盖；只有 `stringify` 的 key 不动（保持 raw）——再 `{ ...defaults, ...typed }`。

  ```ts
  function applyParsers(raw: UrlSearchParams, parsers?: ParserMap) {
    if (!parsers) return raw;
    const out: Record<string, unknown> = { ...raw };
    for (const key of Object.keys(parsers)) {
      if (!(key in raw)) continue;
      const p = normalizeParser(parsers[key]);
      if (p.parse) out[key] = p.parse(raw[key]);
    }
    return out;
  }
  ```

- **写**（`setState` 内）：typed `value` 经 `serializeState(value, parsers)` 还原为 raw——声明的 key 若归一后**有 `stringify`** 则走它，否则原样（交给 `defaultStringify` 用 `String()` 强转 / 数组展开）；`null`/`undefined` 跳过——再 `stringify(raw)` → `writeUrl`。

  ```ts
  function serializeState(state: Record<string, unknown>, parsers?: ParserMap): UrlSearchParams {
    const raw: UrlSearchParams = {};
    for (const [key, value] of Object.entries(state)) {
      if (value == null) continue;
      const p = parsers && key in parsers ? normalizeParser(parsers[key]) : undefined;
      raw[key] = p?.stringify ? p.stringify(value) : (value as string | string[]);
    }
    return raw;
  }
  ```

- `onChange(value, search)` 第一个参数仍是 typed 值、第二个是序列化后的 querystring 串。
- **受控模式不变**：`searchParams !== undefined` 时 `state` 直接取 prop（已是 typed），`setState` 仅 `stringify` + `onChange`、不写 url。
- `useMemo` 依赖保持 `[search]`（`parsers` 走 ref，期望稳定，与 `parse`/`defaults` 同策略）。

## 开发流程（TDD，沿用红-绿-重构垂直切片）

在 `tests/useUrlState.test.ts` 追加切片，每个先写一个失败测试（RED）→ 最小实现（GREEN）→ 必要时重构：

1. `parseAsInteger`：`?count=5` → `state.count === 5`（number）。
2. 未声明 key 保持字符串：`parsers:{count}` 下 `?count=5&name=bob` → `name === 'bob'`。
3. 写回走 `stringify`：`setState({ count: 6 })` → `window.location.search === '?count=6'`。
4. `parseAsBoolean` / `parseAsFloat` 读 + 写。
5. `parseAsArrayOf(parseAsInteger)`：`?c=1&c=2` → `[1,2]`；写 `[3,4]` → `?c=3&c=4`。
6. `parseAsJson`：读被编码的 json → 对象；写回 → 编码 json 串。
7. 非法值 → `null`：`parseAsInteger` 读 `?count=abc` → `state.count === null`。
8. **函数简写**：`parsers: { name: (v) => String(v).toUpperCase() }`，`?name=bob` → `state.name === 'BOB'`；写回无自定义 stringify，走默认（`?name=BOB`）。
9. **对象只写一半**：`{ flag: { parse: (v) => v === '1' } }` 读 `?flag=1` → `true`，写回走默认；`{ k: { stringify: ... } }` 不改变读取类型（仍 raw）。
10. typed `defaultSearchParams` 兜底并与 url 值合并。
11. 函数式更新基于 typed `prev`：`setState(prev => ({ ...prev, count: prev.count + 1 }))`。
12. `onChange` 第一参数为 typed 值、第二参数为 querystring 串。

全绿后重构：抽 `toScalar` / `normalizeParser` / `applyParsers` / `serializeState`，确认 `parsersRef` 让依赖稳定；跑全量测试保持绿（**既有 14 例不回归**）。

## 关键文件（增量）

- 修改 `packages/react-hooks/src/useUrlState.ts`：新增 `Parser` / `ParserInput` 类型、`normalizeParser`、上述 6 个内置 parser、`parsers` option、`ParsedState`/泛型签名、`applyParsers`/`serializeState` 接入读写。
- `packages/react-hooks/src/index.ts`：已是 `export * from './useUrlState'`，内置 parser 与 `Parser` / `ParserInput` 类型**自动对外，无需改动**（构建后验证 d.ts 即可）。
- 修改 `packages/react-hooks/tests/useUrlState.test.ts`：追加上述切片。
- 新增 changeset：`@edram/react-hooks` **minor**（向后兼容新功能，1.0.0 → 1.1.0），描述 `parsers` 选项（函数 / 对象两形态、parse/stringify 可选）+ 内置 parser 列表。

## 验证步骤（增量）

```bash
cd /Users/edram/Workspaces/packages/packages/react-hooks
pnpm test    # 新增切片 + 既有 14 例全绿
pnpm build   # tsdown 产出；确认 Parser / ParserInput / parseAsString / parseAsInteger /
             # parseAsFloat / parseAsBoolean / parseAsArrayOf / parseAsJson 出现在 dist/index.d.ts
cd /Users/edram/Workspaces/packages
pnpm --filter './packages/*' build && pnpm lint   # lint 的类型检查依赖各包 dist（见 release 脚本顺序）
```

类型手验：
```ts
const [s] = useUrlState({
  parsers: {
    count: parseAsInteger,                       // 对象（内置）
    ids: parseAsArrayOf(parseAsInteger),         // 对象（内置）
    name: (v) => String(v).toUpperCase(),        // 函数简写 = parse
  },
});
s.count; // number | null
s.ids;   // number[] | null
s.name;  // string | null
s.other; // string | string[]（未声明 key 仍可访问）

const [t] = useUrlState();      // t: Record<string, string | string[]>（无参向后兼容）
```
