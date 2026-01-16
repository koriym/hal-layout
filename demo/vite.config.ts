import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/hal-layout/demo/',
  resolve: {
    alias: {
      'hal-layout': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
