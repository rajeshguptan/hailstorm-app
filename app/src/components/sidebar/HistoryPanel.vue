<template>
  <div class="history-panel items-start p-2">
    <!-- Search/Filter Section -->
    <div class="mb-3">
      <div class="relative mb-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search history (URL, method, status)..."
          class="w-full px-3 py-2 pl-8 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
        >
        <svg class="absolute left-2 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
    </div>
    <div v-if="filteredHistory.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      {{ searchQuery ? 'No matching requests found' : 'No requests yet' }}
    </div>
    <div v-else class="space-y-1">
      <div v-for="item in filteredHistory" :key="item.id" class="history-item p-2 rounded cursor-pointer bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" @click="handleHistoryClick(item)">
        <div class="flex items-center">
          <span class="badge mr-2" :class="getMethodClass(item.method)">{{ item.method }}</span>
          <span class="history-item-name truncate flex-1 text-sm font-medium text-zinc-900 dark:text-white">{{ item.request.name || item.url }}</span>
        </div>
        <div class="history-item-url truncate text-xs text-zinc-500 dark:text-zinc-400 mt-1">{{ item.url }}</div>
        <div class="flex justify-between items-center mt-1">
          <div class="text-sm">
            <span :class="item.status >= 200 && item.status < 300 ? 'text-green-500' : 'text-red-500'">{{ item.status || 'Error' }}</span>
            <span class="text-zinc-400 dark:text-zinc-500 ml-2">{{ item.time }}ms</span>
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400">
            {{ formatTimestamp(item.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHistoryStore } from '../../stores/history';
import { useRequestsStore } from '../../stores/requests';
import { logger } from '../../utils/logger';
import type { HistoryItem } from '../../types';

const historyStore = useHistoryStore();
const requestsStore = useRequestsStore();

const searchQuery = ref('');

const history = computed(() => historyStore.history);

const filteredHistory = computed(() => {
  if (!searchQuery.value.trim()) {
    return history.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return history.value.filter((item: HistoryItem) => {
    return (
      item.url.toLowerCase().includes(query) ||
      item.method.toLowerCase().includes(query) ||
      item.status.toString().includes(query) ||
      (item.request.name && item.request.name.toLowerCase().includes(query))
    );
  });
});

function getMethodClass(method: string): string {
  const m = method.toLowerCase();
  return m === 'get' ? 'text-green-800 dark:text-green-200 font-dancing font-bold text-xs' : m === 'post' ? 'text-blue-800 dark:text-blue-200 font-dancing font-bold text-xs' : m === 'put' ? 'text-amber-800 dark:text-amber-200 font-dancing font-bold text-xs' : m === 'delete' ? 'text-red-800 dark:text-red-200 font-dancing font-bold text-xs' : 'text-cyan-800 dark:text-cyan-200 font-dancing font-bold text-xs';
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function handleHistoryClick(item: HistoryItem) {
  logger.debug('[HISTORY_PANEL] History item clicked:', item);
  historyStore.loadFromHistory(item);
}
</script>
