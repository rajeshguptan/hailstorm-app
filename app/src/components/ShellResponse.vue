<template>
  <div class="shell-response flex flex-col h-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white">
    <!-- Tab Navigation -->
    <div class="flex border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 border-b-2 transition-colors text-sm"
        :class="activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-auto p-3 bg-zinc-50 dark:bg-zinc-800">
      <div v-if="activeTab === 'script-output'">
        <pre v-if="response?.data" class="text-sm font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{{ response.data }}</pre>
        <div v-else class="text-zinc-400 dark:text-zinc-500">No output yet. Run the shell command to see results.</div>
      </div>

      <div v-if="activeTab === 'console-output'">
        <pre v-if="response?.error" class="text-sm font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap">{{ response.error }}</pre>
        <div v-else class="text-zinc-400 dark:text-zinc-500">No console errors.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useResponseStore } from '../stores/response';

const responseStore = useResponseStore();

const activeTab = ref('script-output');

const tabs = [
  { id: 'script-output', name: 'Script Output' },
  { id: 'console-output', name: 'Console Output' },
];

const response = computed(() => responseStore.response);
</script>