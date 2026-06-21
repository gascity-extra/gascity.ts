import { defineConfig } from 'oxlint';

const config = defineConfig({
  root: true,
  workspace: true,
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
});

export default config;
export { config };
