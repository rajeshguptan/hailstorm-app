<template>
  <div class="environments-panel items-start">
    <div class="flex gap-2 mb-2">
      <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 flex-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click="handleImport">Import</button>
      <button class="btn btn-sm bg-blue-500 text-white flex-1 hover:bg-blue-600" @click="store.addEnvironment()">+ Environment</button>
    </div>
    <div v-if="environments.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No environments yet
    </div>
    <div v-else>
      <div v-for="env in environments" :key="env.id" class="environment-item p-2 rounded mb-2 cursor-pointer bg-zinc-200 dark:bg-zinc-800" :class="{ 'bg-blue-900 dark:bg-blue-900': env.id === activeEnvironmentId }" @click="store.selectEnvironment(env.id)" @contextmenu.prevent="store.showContextMenu($event, 'environment', env.id)">
        <div class="flex justify-between items-center">
          <span class="text-zinc-900 dark:text-white">{{ env.name }}</span>
          <span v-if="env.id === activeEnvironmentId" class="badge bg-green-500">Active</span>
        </div>
        <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {{ env.variables.length }} variables
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/app';

const store = useAppStore();
const environments = computed(() => store.environments);
const activeEnvironmentId = store.activeEnvironmentId;

async function handleImport() {
  try {
    if (!window.api) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          importData(data);
        } catch (err) {
          console.error('Failed to import:', err);
        }
      };
      input.click();
      return;
    }
    const content = await window.api.importEnvironment();
    if (!content) {
      console.log('No content returned from file dialog');
      return;
    }
    const data = JSON.parse(content);
    importData(data);
  } catch (err) {
    console.error('Import error:', err);
  }
}

function importData(data: any) {
  if (!data) return;
  if (data.environment) {
    store.environments.push(data.environment);
    store.saveToLocalStorage();
  } else if (data.environments) {
    store.environments.push(...data.environments);
    store.saveToLocalStorage();
  } else if (Array.isArray(data)) {
    store.environments.push(...data);
    store.saveToLocalStorage();
  } else {
    console.log('Unknown data format:', Object.keys(data));
  }
}
</script>