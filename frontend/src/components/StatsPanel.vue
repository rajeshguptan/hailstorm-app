<template>
  <div class="stats-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="stats-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <h3 class="font-semibold text-zinc-900 dark:text-white">Stats</h3>
    </div>
    <div class="stats-content flex-1 overflow-auto p-4">
      <div v-if="!computedStats.totalRequests" class="text-zinc-500 italic">
        No test data yet. Run a collection to see stats.
      </div>
      <div v-else class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
            <div class="text-xs text-zinc-500">Total Requests</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ computedStats.totalRequests }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
            <div class="text-xs text-zinc-500">Passed</div>
            <div class="text-xl font-bold text-green-600 dark:text-green-400">{{ computedStats.passed }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
            <div class="text-xs text-zinc-500">Failed</div>
            <div class="text-xl font-bold text-red-600 dark:text-red-400">{{ computedStats.failed }}</div>
          </div>
          <div class="stat-card bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
            <div class="text-xs text-zinc-500">Avg Response Time</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ computedStats.avgTime }}ms</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();

const computedStats = computed(() => store.testStats);
</script>

<style scoped>
.stat-card {
  min-height: 60px;
}
</style>