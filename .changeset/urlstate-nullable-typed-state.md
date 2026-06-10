---
'@edram/react-hooks': patch
---

fix(useUrlState): 类型对齐运行时行为——setState 入参允许 null / undefined 值（删除 key）；声明 parser 的 key 如实为 `T | null | undefined`（解析失败 → null，url 缺失 → undefined）；未声明 key 不再被 parsers 影响，保持 `string | string[]`
