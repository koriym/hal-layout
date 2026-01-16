import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'hal-layout': '../src/index.ts',
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
