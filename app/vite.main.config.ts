import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      fileName: () => 'main.cjs',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', 'node:fs', 'node:path', 'node:child_process', 'fs', 'path', 'child_process'],
    }
  }
});
