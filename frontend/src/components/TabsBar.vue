<template>
  <div class="tabs-bar flex items-center bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-2" style="min-height: 40px;">
    <div class="tabs-list flex gap-1 flex-1 overflow-auto" style="max-width: calc(100% - 40px);">
      <div v-for="tab in store.tabs" :key="tab.id" class="tab flex items-center px-2 py-1 rounded cursor-pointer" :class="{ 'bg-zinc-200 dark:bg-zinc-700': tab.id === store.activeTabId }" @click="store.switchTab(tab.id)">
        <span class="badge mr-1" :class="getMethodClass(tab)">{{ tab.request.method }}</span>
        <span class="mr-1 truncate text-zinc-900 dark:text-white" style="max-width: 120px;">{{ tab.request.name || 'Untitled' }}</span>
        <span class="text-zinc-400 dark:text-zinc-500" @click.stop="store.closeTab(tab.id)">×</span>
      </div>
    </div>
    <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 ml-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="store.addNewTab()">+</button>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app';

const store = useAppStore();

function getMethodClass(tab: any): string {
  const method = tab.request.method?.toLowerCase() || 'get';
  return method === 'get' ? 'text-green-800 dark:text-green-200 font-dancing font-bold text-xs' : method === 'post' ? 'text-blue-800 dark:text-blue-200 font-dancing font-bold text-xs' : method === 'put' ? 'text-amber-800 dark:text-amber-200 font-dancing font-bold text-xs' : method === 'delete' ? 'text-red-800 dark:text-red-200 font-dancing font-bold text-xs' : 'text-cyan-800 dark:text-cyan-200 font-dancing font-bold text-xs';
}
</script>