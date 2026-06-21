import { defineConfig } from 'tsdown';

const config = defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: 'esm',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['react', 'react-dom', 'zod'],
  tsconfig: 'tsconfig.json',
  onSuccess: async () => {
    console.log('Build completed!');
  },
});

export default config;
export { config };
