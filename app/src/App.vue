<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from './stores';
import { useTheme } from './composables/useTheme';

const store = useAppStore();
const { loadTheme } = useTheme();

// Capture console logs and send to main process
function captureConsoleLogs() {
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
    (console as any)[level] = (...args: any[]) => {
      const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args);
      const stack = new Error().stack?.split('\n')?.[2] || '';
      const match = stack.match(/at\s+.*?\((.*?):(\d+):(\d+)\)/);
      const sourceId = match ? match[1].split('/').pop() : '';
      
      window.api.sendConsoleLog({
        level: level === 'log' ? 0 : level === 'info' ? 1 : level === 'warn' ? 2 : level === 'error' ? 3 : 0,
        message,
        line: match ? parseInt(match[2]) : 0,
        sourceId
      });
      
      (originalConsole as any)[level](...args);
    };
  });
}

onMounted(async () => {
  loadTheme(); // Apply theme immediately on app start
  await store.init();
  captureConsoleLogs();
});
</script>
