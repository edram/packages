---
'@edram/react-hooks': minor
---

feat(useUrlState): 重新加入 `defaultSearchParams` 选项

初始 querystring，仅首次渲染生效，挂载后以真实 URL 为准；支持字符串 / `URLSearchParams` / 与 setState 入参同构的对象。用于「新页面渲染时 `window.location` 还停留在旧路由」的场景（Next.js App Router 在 render 完成后才于 insertion effect 中 pushState），可直接传 `useSearchParams()`。
