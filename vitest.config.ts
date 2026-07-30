import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '.cache/vitest',
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    clearMocks: true,
    restoreMocks: true,
  },
});
