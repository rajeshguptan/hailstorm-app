<template>
  <div class="history-panel items-start">
    <div v-if="history.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No requests yet
    </div>
    <div v-else>
      <div v-for="item in history" :key="item.id" class="history-item p-2 rounded mb-1 cursor-pointer bg-zinc-100 dark:bg-zinc-800" @click="store.loadFromHistory(item)">
        <div class="flex items-center">
          <span class="badge mr-2" :class="getMethodClass(item.method)">{{ item.method }}</span>
          <span class="truncate flex-1 text-sm text-zinc-700 dark:text-zinc-300">{{ item.url }}</span>
        </div>
        <div class="text-sm mt-1">
          <span :class="item.status >= 200 && item.status < 300 ? 'text-green-500' : 'text-red-500'">{{ item.status || 'Error' }}</span>
          <span class="text-zinc-400 dark:text-zinc-500 ml-2">{{ item.time }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app';

const store = useAppStore();

const history = store.history;

function getMethodClass(method: string): string {
  const m = method.toLowerCase();
  return m === 'get' ? 'bg-green-500' : m === 'post' ? 'bg-blue-500' : m === 'put' ? 'bg-yellow-500 text-black' : m === 'delete' ? 'bg-red-500' : 'bg-cyan-500';
}
</script>