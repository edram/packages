# oxlint-config-edram

## 0.1.0

### Minor Changes

- [`5490cab`](https://github.com/edram/packages/commit/5490cab667226201fabd1a79ea234aac625611f8) Thanks [@edram](https://github.com/edram)! - chore: 底层前端脚手架迁移到 VoidZero 工具链

  - 构建：`tsc` 双遍 → **tsdown**（Rolldown + Oxc），产物从 `lib/` + `esm/` 统一切到 `dist/`（ESM `*.js` + CJS `*.cjs` + `*.d.ts`），同步更新 `main`/`module`/`types`/`exports`/`files`
  - Lint：ESLint → **oxlint**，新增共享配置包 `oxlint-config-edram`
  - 格式化：Prettier → **oxfmt**
  - 测试：Vitest 0.34 → **4.x**，`@vitejs/plugin-react` 4 → 6
