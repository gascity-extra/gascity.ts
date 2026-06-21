import { defineConfig } from 'tsdown';
import config from '../../../configs/tsdown.config.ts';

export default defineConfig({
  ...config,
  entry: {
    index: 'src/index.ts',
  },
  react: true,
  jsx: 'automatic',
  // Add React-specific plugins if needed
});
