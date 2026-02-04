import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        'vitest.config.ts',
        'eslint.config.js',
      ],
      // Note: Thresholds set for initial setup. Increase as coverage improves.
      thresholds: {
        statements: 2,
        branches: 40,
        functions: 20,
        lines: 2,
      },
    },
  },
});
