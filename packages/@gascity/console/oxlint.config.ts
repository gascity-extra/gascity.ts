import { defineConfig } from 'oxlint';

const config = defineConfig({
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
});

export default config;
export { config };
