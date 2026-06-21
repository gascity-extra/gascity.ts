import { defineConfig } from 'oxlint';

export default defineConfig({
  root: true,
  workspace: true,
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
});
