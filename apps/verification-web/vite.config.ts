import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      '@qa-ai-challenge/shared': resolve(__dirname, '../../libs/shared/src/index.ts'),
    },
  },
  server: {
    port: 4200,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
