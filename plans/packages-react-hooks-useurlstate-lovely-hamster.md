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
