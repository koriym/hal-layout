import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/hal-layout/demo/',
  resolve: {
    alias: {
      'hal-layout': path.resolve(__dirname, '../src/index.ts'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
