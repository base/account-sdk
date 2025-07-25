import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      ':core': path.resolve(__dirname, 'src/core'),
      ':store': path.resolve(__dirname, 'src/store'),
      ':sign': path.resolve(__dirname, 'src/sign'),
      ':util': path.resolve(__dirname, 'src/util'),
      ':ui': path.resolve(__dirname, 'src/ui'),
      ':i18n': path.resolve(__dirname, 'src/i18n'),
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
