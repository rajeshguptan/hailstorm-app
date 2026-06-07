<template>
  <div class="environments-panel items-start">
    <div class="flex gap-2 mb-2">
      <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 flex-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click="handleImport">Import</button>
      <button class="btn btn-sm bg-blue-500 text-white flex-1 hover:bg-blue-600" @click="environmentsStore.addEnvironment()">+ Environment</button>
    </div>
    <div v-if="environments.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No environments yet
    </div>
    <div v-else>
      <div v-for="env in environments" :key="env.id" class="environment-item p-2 rounded mb-2 cursor-pointer bg-zinc-200 dark:bg-zinc-800" :class="{ 'bg-blue-900 dark:bg-blue-900': env.id === activeEnvironmentId }" @click="environmentsStore.selectEnvironment(env.id)" @contextmenu.prevent="uiStore.showContextMenu($event, 'environment', env.id)">
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
import { useEnvironmentsStore } from '../../stores/environments';
import { useAppStore } from '../../stores';
import { useUIStore } from '../../stores/ui';

const environmentsStore = useEnvironmentsStore();
const appStore = useAppStore();
const uiStore = useUIStore();
const environments = computed(() => environmentsStore.environments);
const activeEnvironmentId = ref(environmentsStore.activeEnvironmentId || '');

// Watch for changes to environmentsStore.activeEnvironmentId and update the ref
watch(() => environmentsStore.activeEnvironmentId, (newId, oldId) => {
  console.log('[EnvironmentsPanel] environmentsStore.activeEnvironmentId changed from', oldId, 'to', newId);
  console.log('[EnvironmentsPanel] Updating ref from', activeEnvironmentId.value, 'to', newId || '');
  activeEnvironmentId.value = newId || '';
});

// Watch for environments changes and ensure active environment
watch(() => environments.value, (newEnvs) => {
  if (newEnvs.length > 0 && !environmentsStore.activeEnvironmentId) {
    // Select the first environment if none is active
    environmentsStore.selectEnvironment(newEnvs[0].id);
  }
});

// Fallback: if no active environment but we have environments, check for legacy active flag
function ensureActiveEnvironment() {
  if (!environmentsStore.activeEnvironmentId && environments.value.length > 0) {
    const activeEnv = environments.value.find(e => e.active);
    if (activeEnv) {
      environmentsStore.selectEnvironment(activeEnv.id);
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
    environmentsStore.environments.push(data.environment);
    appStore.saveToLocalStorage();

    environmentsStore.environments.push(...data.environments);
    appStore.saveToLocalStorage();

    environmentsStore.environments.push(...data);
    appStore.saveToLocalStorage();
  } else if (Array.isArray(data)) {
    environmentsStore.environments.push(...data);
    appStore.saveToLocalStorage();
  } else {
    console.log('Unknown data format:', Object.keys(data));
  }
}
</script>