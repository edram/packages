---
'@edram/react-hooks': major
---

feat(useUrlState): defaultValue / clearOnDefault / parser.withDefault

- **BREAKING**：`defaultSearchParams` 重命名为 `defaultValue`，并带类型推导——提供默认值的 key 在 state 类型里去掉 `undefined`（无 parser 的 key 为 `string | string[]`，有 parser 的为 `T | null`）
- 新增 `clearOnDefault`（默认 `true`，**行为变化**）：写回时值等于默认值的 key 不写入 url，读取时由默认值兜底
- 内置 parser 新增 `withDefault(value)`：url 缺失或解析失败都回退默认值，state 类型收窄为精确的 `T`；同一 key 上 `defaultValue` 选项优先级高于 `parser.withDefault`
