import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'hal-layout': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
