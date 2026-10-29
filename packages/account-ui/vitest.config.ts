import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: [
      {
        find: '../preact/mountBasePayButton.js',
        replacement: path.resolve(__dirname, 'src/frameworks/preact/mountBasePayButton.ts'),
      },
      {
        find: '../preact/mountSignInWithBaseButton.js',
        replacement: path.resolve(__dirname, 'src/frameworks/preact/mountSignInWithBaseButton.ts'),
      },
    ],
  },
  test: {
    alias: {
      ':types': path.resolve(__dirname, 'src/types'),
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
