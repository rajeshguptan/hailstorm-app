<template>
  <div class="script-tabs flex flex-col h-full">
    <div class="flex border-b border-zinc-200 dark:border-zinc-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeSubTab = tab.id"
        class="px-4 py-2 border-b-2 transition-colors text-sm"
        :class="activeSubTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
      >
        {{ tab.name }}
      </button>
    </div>

<div class="flex-1 overflow-auto pt-3">
       <div v-if="activeSubTab === 'pre-request'" class="h-full">
         <textarea
           v-model="modelValue.preRequestScript"
           class="w-full h-full min-h-[120px] px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
           placeholder="// Runs before request is sent"
         ></textarea>
       </div>

       <div v-if="activeSubTab === 'post-request'" class="h-full">
         <textarea
           v-model="modelValue.postRequestScript"
           class="w-full h-full min-h-[120px] px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
           placeholder="// Runs after response is received"
         ></textarea>
       </div>

       <div v-if="activeSubTab === 'test'" class="h-full">
         <textarea
           v-model="modelValue.testScript"
           class="w-full h-full min-h-[120px] px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
           placeholder="// Test the response"
         ></textarea>
       </div>
     </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface ScriptTabsModel {
  preRequestScript?: string;
  postRequestScript?: string;
  testScript?: string;
}

defineProps<{
  modelValue: ScriptTabsModel;
}>();

const activeSubTab = ref('pre-request');

const tabs = [
  { id: 'pre-request', name: 'Pre-request Script' },
  { id: 'post-request', name: 'Post-request Script' },
  { id: 'test', name: 'Test Script' }
];
</script>