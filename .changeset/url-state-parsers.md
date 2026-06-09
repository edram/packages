---
'@edram/react-hooks': minor
---

useUrlState 新增 per-key `parsers`：按 key 把 querystring 解析成 typed 值（写回 url 自动反序列化），未声明的 key 保持 `string | string[]`。`parsers[key]` 可传函数（当作 `parse`）或 `{ parse?, stringify? }` 对象（两者均可选）。同时导出内置解析器 `parseAsString` / `parseAsInteger` / `parseAsFloat` / `parseAsBoolean` / `parseAsArrayOf` / `parseAsJson` 及 `Parser` / `ParserInput` 类型。
