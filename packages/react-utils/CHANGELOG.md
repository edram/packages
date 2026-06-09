# @edram/react-utils

## 0.1.0

### Minor Changes

- [`5490cab`](https://github.com/edram/packages/commit/5490cab667226201fabd1a79ea234aac625611f8) Thanks [@edram](https://github.com/edram)! - chore: 底层前端脚手架迁移到 VoidZero 工具链

  - 构建：`tsc` 双遍 → **tsdown**（Rolldown + Oxc），产物从 `lib/` + `esm/` 统一切到 `dist/`（ESM `*.js` + CJS `*.cjs` + `*.d.ts`），同步更新 `main`/`module`/`types`/`exports`/`files`
  - Lint：ESLint → **oxlint**，新增共享配置包 `oxlint-config-edram`
  - 格式化：Prettier → **oxfmt**
  - 测试：Vitest 0.34 → **4.x**，`@vitejs/plugin-react` 4 → 6

### Patch Changes

- Updated dependencies [[`5490cab`](https://github.com/edram/packages/commit/5490cab667226201fabd1a79ea234aac625611f8)]:
  - @edram/utils@0.1.0

## 0.0.3

### Patch Changes

- Updated dependencies [[`b856fa6`](https://github.com/edram/packages/commit/b856fa6e6e71fd779ed101d91cafc5319b2aaf0c)]:
  - @edram/utils@0.0.2

## 0.0.2

### Patch Changes

- [`36366cd`](https://github.com/edram/packages/commit/36366cdc64d12c5e0484f57bafe081c71ec624df) Thanks [@edram](https://github.com/edram)! - feat: 根据 selector ref 和 Element 返回元素

## 0.0.1

### Patch Changes

- [`49adc89`](https://github.com/edram/packages/commit/49adc892b3ec569a705d98a268803644f4e61b6c) Thanks [@edram](https://github.com/edram)! - feat(react-utils): 增加 assignRef 方法
