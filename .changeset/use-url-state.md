---
'@edram/react-hooks': major
---

feat: 新增 `useUrlState` hook，动态同步 querystring

动态解析整份 querystring（无需预先声明 key 或 schema），把表单值等状态读写到 url 上，典型场景为动态表单 `{a:'a',b:'b'}` ↔ `?a=a&b=b`。

- 基于 `useSyncExternalStore`，server-safe（提供 `getServerSnapshot`，SSR 不读 `window`）
- 支持受控/非受控、`setState` 函数式更新、`push`/`replace`、自定义 `parse`/`stringify`
- 同名 key ↔ 数组，响应 `popstate` 前进后退

**BREAKING CHANGE**：不再支持 React 16/17，`peerDependencies` 提升到 `^18 || ^19`（`useSyncExternalStore` 需要 React 18+）。
