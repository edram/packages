import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test.ts', 'tests/**/*.test-d.ts'],
    },
  },
});
