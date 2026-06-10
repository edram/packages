# @edram/react-hooks

## 2.1.0

### Minor Changes

- [`631613f`](https://github.com/edram/packages/commit/631613f847c56dea96dc944276bfe7d88045231d) Thanks [@edram](https://github.com/edram)! - feat(useUrlState): 重新加入 `defaultSearchParams` 选项

  初始 querystring，仅首次渲染生效，挂载后以真实 URL 为准；支持字符串 / `URLSearchParams` / 与 setState 入参同构的对象。用于「新页面渲染时 `window.location` 还停留在旧路由」的场景（Next.js App Router 在 render 完成后才于 insertion effect 中 pushState），可直接传 `useSearchParams()`。

## 2.0.0

### Major Changes

- [`451ff19`](https://github.com/edram/packages/commit/451ff1966bbf86d4d95cc2700391f538c7397dba) Thanks [@edram](https://github.com/edram)! - feat(useUrlState): defaultValue / clearOnDefault / parser.withDefault

  - **BREAKING**：`defaultSearchParams` 重命名为 `defaultValue`，并带类型推导——提供默认值的 key 在 state 类型里去掉 `undefined`（无 parser 的 key 为 `string | string[]`，有 parser 的为 `T | null`）
  - 新增 `clearOnDefault`（默认 `true`，**行为变化**）：写回时值等于默认值的 key 不写入 url，读取时由默认值兜底
  - 内置 parser 新增 `withDefault(value)`：url 缺失或解析失败都回退默认值，state 类型收窄为精确的 `T`；同一 key 上 `defaultValue` 选项优先级高于 `parser.withDefault`

### Patch Changes

- [`11cac91`](https://github.com/edram/packages/commit/11cac91e22ae33b5d32baee6db0550e57d6e9f58) Thanks [@edram](https://github.com/edram)! - fix(useUrlState): 类型对齐运行时行为——setState 入参允许 null / undefined 值（删除 key）；声明 parser 的 key 如实为 `T | null | undefined`（解析失败 → null，url 缺失 → undefined）；未声明 key 不再被 parsers 影响，保持 `string | string[]`

## 1.1.0

### Minor Changes

- [`f1ff8b3`](https://github.com/edram/packages/commit/f1ff8b3ae62958ec7157656a67a3129ac9e5204a) Thanks [@edram](https://github.com/edram)! - useUrlState 新增 per-key `parsers`：按 key 把 querystring 解析成 typed 值（写回 url 自动反序列化），未声明的 key 保持 `string | string[]`。`parsers[key]` 可传函数（当作 `parse`）或 `{ parse?, stringify? }` 对象（两者均可选）。同时导出内置解析器 `parseAsString` / `parseAsInteger` / `parseAsFloat` / `parseAsBoolean` / `parseAsArrayOf` / `parseAsJson` 及 `Parser` / `ParserInput` 类型。

## 1.0.0

### Major Changes

- [`cccc94b`](https://github.com/edram/packages/commit/cccc94bf85247254a2bec7cd592025ec260ed870) Thanks [@edram](https://github.com/edram)! - feat: 新增 `useUrlState` hook，动态同步 querystring

  动态解析整份 querystring（无需预先声明 key 或 schema），把表单值等状态读写到 url 上，典型场景为动态表单 `{a:'a',b:'b'}` ↔ `?a=a&b=b`。

  - 基于 `useSyncExternalStore`，server-safe（提供 `getServerSnapshot`，SSR 不读 `window`）
  - 支持受控/非受控、`setState` 函数式更新、`push`/`replace`、自定义 `parse`/`stringify`
  - 同名 key ↔ 数组，响应 `popstate` 前进后退

  **BREAKING CHANGE**：不再支持 React 16/17，`peerDependencies` 提升到 `^18 || ^19`（`useSyncExternalStore` 需要 React 18+）。

### Minor Changes

- [`5490cab`](https://github.com/edram/packages/commit/5490cab667226201fabd1a79ea234aac625611f8) Thanks [@edram](https://github.com/edram)! - chore: 底层前端脚手架迁移到 VoidZero 工具链

  - 构建：`tsc` 双遍 → **tsdown**（Rolldown + Oxc），产物从 `lib/` + `esm/` 统一切到 `dist/`（ESM `*.js` + CJS `*.cjs` + `*.d.ts`），同步更新 `main`/`module`/`types`/`exports`/`files`
  - Lint：ESLint → **oxlint**，新增共享配置包 `oxlint-config-edram`
  - 格式化：Prettier → **oxfmt**
  - 测试：Vitest 0.34 → **4.x**，`@vitejs/plugin-react` 4 → 6

### Patch Changes

- Updated dependencies [[`5490cab`](https://github.com/edram/packages/commit/5490cab667226201fabd1a79ea234aac625611f8)]:
  - @edram/react-utils@0.1.0

## 0.0.20

### Patch Changes

- [`9955f71`](https://github.com/edram/packages/commit/9955f7130bf03ec2575d72506677b3668da3ff6c) Thanks [@edram](https://github.com/edram)! - fix: 修复 globalThis.navigator undefined 的情况

## 0.0.19

### Patch Changes

- [`8f81f56`](https://github.com/edram/packages/commit/8f81f56a27de8d00a771672bde59dbd6f1c3b7fc) Thanks [@edram](https://github.com/edram)! - fix: 使用 globalThis 修复类型错误

## 0.0.18

### Patch Changes

- [`92a6175`](https://github.com/edram/packages/commit/92a61755b132a98a0ba46935cb4062442b4982a5) Thanks [@edram](https://github.com/edram)! - feat: 增加 useUAParser hook

## 0.0.17

### Patch Changes

- Updated dependencies []:
  - @edram/react-utils@0.0.3

## 0.0.16

### Patch Changes

- [`44332ee`](https://github.com/edram/packages/commit/44332eea8d51e74942a4a99b1d05636c40cce6c3) Thanks [@edram](https://github.com/edram)! - feat: 增加 useCopyToClipboard hook

- Updated dependencies []:
  - @edram/react-utils@0.0.2

## 0.0.15

### Patch Changes

- Updated dependencies [[`36366cd`](https://github.com/edram/packages/commit/36366cdc64d12c5e0484f57bafe081c71ec624df)]:
  - @edram/react-utils@0.0.2

## 0.0.14

### Patch Changes

- [`0ee8b24`](https://github.com/edram/packages/commit/0ee8b24493492a6cbbd108855c0944129762bc7a) Thanks [@edram](https://github.com/edram)! - feat: eslint 增加 consistent-type-imports 规则

- Updated dependencies []:
  - @edram/react-utils@0.0.1

## 0.0.13

### Patch Changes

- [`16caf29`](https://github.com/edram/packages/commit/16caf29b448982505bfe7252153e6e1d35a4ee18) Thanks [@edram](https://github.com/edram)! - fix: 修复 useMergeRefs 导出错误

## 0.0.12

### Patch Changes

- [`f8ecb0f`](https://github.com/edram/packages/commit/f8ecb0facee29c4e114515ee4fc22467917af027) Thanks [@edram](https://github.com/edram)! - fix: 导出 useMergeRefs

## 0.0.11

### Patch Changes

- [`2044b2a`](https://github.com/edram/packages/commit/2044b2a685dbea1c7a10dbeb5bb3b8b16247e8b3) Thanks [@edram](https://github.com/edram)! - feat: 增加 useMergeRefs hook

## 0.0.10

### Patch Changes

- [`35fe006`](https://github.com/edram/packages/commit/35fe006c9340fe1a5f9246a4f14a1c2b788c9aac) Thanks [@edram](https://github.com/edram)! - fix(react-hooks): export useClickAway

## 0.0.9

### Patch Changes

- [`d7ddd44`](https://github.com/edram/packages/commit/d7ddd44b4dc187d81b9d54d690b1f221c3ccc2ec) Thanks [@edram](https://github.com/edram)! - feat(react-hooks): add useClickAway hook

## 0.0.8

### Patch Changes

- [`4b86688`](https://github.com/edram/packages/commit/4b8668882c63016df6ce6ebf4e22638a600ec6d2) Thanks [@edram](https://github.com/edram)! - refactor: 单元测试移动到 tests 文件夹中

## 0.0.7

### Patch Changes

- [`89ef740`](https://github.com/edram/packages/commit/89ef7402a85e9d49812061b40577c577d535355b) Thanks [@edram](https://github.com/edram)! - chore: add typings 配置, next 打包时发现 eslint 报类型

## 0.0.6

### Patch Changes

- [#20](https://github.com/edram/packages/pull/20) [`859965d`](https://github.com/edram/packages/commit/859965db68f765ac8525050e3c004376cd8dc306) Thanks [@edram](https://github.com/edram)! - chore: 增加 react 配置

## 0.0.5

### Patch Changes

- [#18](https://github.com/edram/packages/pull/18) [`dbe9c32`](https://github.com/edram/packages/commit/dbe9c3298de101d4bb7226edc7c8351efe766855) Thanks [@edram](https://github.com/edram)! - fix: extends @edram/tsconfig

## 0.0.4

### Patch Changes

- [#16](https://github.com/edram/packages/pull/16) [`091bfdb`](https://github.com/edram/packages/commit/091bfdb6bd3da59f393570047dc593e4a1f7bf09) Thanks [@edram](https://github.com/edram)! - build(react-hooks): add eslint

## 0.0.3

### Patch Changes

- [#12](https://github.com/edram/packages/pull/12) [`4247b56`](https://github.com/edram/packages/commit/4247b569e6fdeab178bd2d14f35a978ba121681a) Thanks [@edram](https://github.com/edram)! - build(react-hooks): add eslint and prettier

## 0.0.2

### Patch Changes

- [#6](https://github.com/edram/packages/pull/6) [`47ac8f1`](https://github.com/edram/packages/commit/47ac8f17159c38c6d1663d8a6510b7ab51dd4f49) Thanks [@edram](https://github.com/edram)! - test: 增加测试用户

## 0.0.1

### Patch Changes

- [#4](https://github.com/edram/packages/pull/4) [`8e781dd`](https://github.com/edram/packages/commit/8e781dd01b3c6bf29620a65a52a104855d8b0f0d) Thanks [@edram](https://github.com/edram)! - init react-hook
