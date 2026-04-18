<template>
  <div class="utilities-list">
    <div v-for="util in utilities" :key="util.id">
      <div
        class="flex items-center p-2 rounded cursor-pointer mb-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        :class="{ 'bg-zinc-300 dark:bg-zinc-600': store.selectedUtilityId === util.id }"
        @click="store.selectUtility(util.id)"
      >
        <span class="text-lg mr-2">{{ util.icon }}</span>
        <span class="text-sm text-zinc-900 dark:text-white">{{ util.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '../../stores/app';

const store = useAppStore();

const utilities = ref([
  { id: 'shell', name: 'OS Command', icon: '💻' },
  { id: 'az-token', name: 'Azure Token', icon: '☁️' },
]);
</script>