<template>
  <div class="environments-panel items-start">
    <div class="mb-3">
      <label class="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Active Environment</label>
      <select :value="activeEnvironmentId" @change="handleEnvironmentChange($event.target.value)" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
        <option value="">No Environment</option>
        <option v-for="env in environments" :key="env.id" :value="env.id">{{ env.name }}</option>
      </select>
    </div>
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
import { computed, onMounted, watch, ref } from 'vue';
import { useAppStore } from '../../stores/app';

const store = useAppStore();
const environments = computed(() => store.environments);
const activeEnvironmentId = ref(store.activeEnvironmentId || '');

// Watch for changes to store.activeEnvironmentId and update the ref
watch(() => store.activeEnvironmentId, (newId, oldId) => {
  console.log('[EnvironmentsPanel] store.activeEnvironmentId changed from', oldId, 'to', newId);
  console.log('[EnvironmentsPanel] Updating ref from', activeEnvironmentId.value, 'to', newId || '');
  activeEnvironmentId.value = newId || '';
});

// Watch for environments changes and ensure active environment
watch(() => environments.value, (newEnvs) => {
  if (newEnvs.length > 0 && !store.activeEnvironmentId) {
    ensureActiveEnvironment();
  }
}, { immediate: true });

// Handle selection changes
function handleEnvironmentChange(value: string) {
  console.log('[EnvironmentsPanel] handleEnvironmentChange called with:', value);
  store.selectEnvironment(value || null);
}

// Fallback: if no active environment but we have environments, check for legacy active flag
function ensureActiveEnvironment() {
  if (!store.activeEnvironmentId && environments.value.length > 0) {
    const activeEnv = environments.value.find(env => env.active);
    if (activeEnv) {
      console.log('[EnvironmentsPanel] Found legacy active environment:', activeEnv.id);
      store.selectEnvironment(activeEnv.id);
    }
  }
}

onMounted(() => {
  console.log('[EnvironmentsPanel] Component mounted');

  // Ensure we have an active environment
  ensureActiveEnvironment();
});

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