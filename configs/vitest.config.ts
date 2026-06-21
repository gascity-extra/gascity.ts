import { defineConfig } from 'vitest/config';
import path from 'node:path';

const config = defineConfig({
  test: {
    include: ['packages/@gascity/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/@gascity/*/src/**/*.ts'],
    },
  },
  workspace: './vitest.workspace.ts',
});

export default config;
export { config };
