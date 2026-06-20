<template>
  <div class="console-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="console-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
      <h3 class="font-semibold text-zinc-900 dark:text-white">Console</h3>
      <button @click="store.consoleLogs = []" class="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded text-zinc-700 dark:text-zinc-300">Clear</button>
    </div>
    <div ref="consoleContent" class="console-content flex-1 overflow-auto p-2 font-mono text-sm bg-zinc-50 dark:bg-zinc-900">
      <div v-for="(log, index) in store.consoleLogs" :key="index" class="log-line py-0.5" :class="logClass(log.type)">
        <span class="text-zinc-400 dark:text-zinc-500">[{{ log.time }}]</span>
        <span :class="logTypeClass(log.type)">[{{ log.type.toUpperCase() }}]</span>
        <span class="ml-2">{{ log.message }}</span>
      </div>
      <div v-if="store.consoleLogs.length === 0" class="text-zinc-400 dark:text-zinc-500 italic">No logs yet...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useAppStore } from '../stores';

const store = useAppStore();

const consoleContent = ref<HTMLElement | null>(null);

function logClass(type: string): string {
  return '';
}

function logTypeClass(type: string): string {
  switch (type) {
    case 'log': return 'text-zinc-400 dark:text-zinc-400';
    case 'info': return 'text-blue-400 dark:text-blue-400';
    case 'warn': return 'text-yellow-400 dark:text-yellow-400';
    case 'error': return 'text-red-400 dark:text-red-400';
    case 'debug': return 'text-zinc-400 dark:text-zinc-500';
    default: return 'text-zinc-400';
  }
}

watch(() => store.consoleLogs.length, async () => {
  await nextTick();
  if (consoleContent.value) {
    consoleContent.value.scrollTop = consoleContent.value.scrollHeight;
  }
});
</script>

<style scoped>
.console-content {
  background: #fafafa;
}
.dark .console-content {
  background: #1a1a1a;
}
.log-line {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>