<template>
  <div class="response-panel bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white flex-1 flex flex-col overflow-hidden">
    <div class="response-status p-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
      <span v-if="store.response" :class="store.response.status >= 200 && store.response.status < 300 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'">
        {{ store.response.status }}
      </span>
      <span v-if="store.response" :class="store.response.status >= 200 && store.response.status < 300 ? 'text-green-600' : 'text-red-600'">
        {{ store.response.statusText }}
      </span>
      <span v-else class="text-zinc-400 dark:text-zinc-500">Ready to send request</span>
      <span v-if="store.response" class="text-zinc-400 dark:text-zinc-500 text-sm">{{ store.response.time }}ms</span>
    </div>
    
    <ul class="flex border-b border-zinc-200 dark:border-zinc-700" role="tablist">
      <li>
        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeResponseTab === 'body' }" @click="store.activeResponseTab = 'body'">Body</button>
      </li>
      <li>
        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeResponseTab === 'headers' }" @click="store.activeResponseTab = 'headers'">Headers</button>
      </li>
      <li>
        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeResponseTab === 'tests' }" @click="store.activeResponseTab = 'tests'">Script output</button>
      </li>
    </ul>
    
    <div class="response-content flex-1 p-2 overflow-auto font-mono text-sm whitespace-pre-wrap">
      <div v-if="store.activeResponseTab === 'body'">
        {{ responseBody }}
      </div>
      <div v-if="store.activeResponseTab === 'headers'">
        {{ responseHeaders }}
      </div>
<div v-if="store.activeResponseTab === 'tests'">
  <div v-if="store.testResults" class="whitespace-pre-wrap"><span class="text-zinc-500">Source: {{ store.scriptSource }}</span><br><br>{{ store.testResults }}</div>
  <div v-else>No script output</div>
</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useResponseStore } from '../../stores/response';

const store = useResponseStore();

const responseBody = computed(() => {
  if (!store.response) return 'Response will appear here';
  try {
    const parsed = JSON.parse(store.response.data);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return store.response.data || '(empty response)';
  }
});

const responseHeaders = computed(() => {
  if (!store.response) return '';
  return Object.entries(store.response.headers)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');
});
</script>