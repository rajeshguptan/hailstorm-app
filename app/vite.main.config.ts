import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'fs', 'child_process'],
      // Include runnerEngine in the build even though it's dynamically loaded
      input: {
        main: 'src/main.ts',
      },
    }
  }
});