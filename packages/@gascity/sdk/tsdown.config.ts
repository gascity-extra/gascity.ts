import { defineConfig } from 'tsdown';
import config from '../../configs/tsdown.config';

export default defineConfig({
  ...config,
  entry: {
    index: 'src/index.ts',
  },
});
