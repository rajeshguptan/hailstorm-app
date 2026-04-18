<template>
  <div class="environment-detail-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div v-if="!activeEnvironment" class="p-4 text-center">
      <div class="text-zinc-500">Select an environment from the sidebar to view its variables.</div>
    </div>

    <div v-else class="flex flex-col h-full">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <input
          v-model="editingEnvironment.name"
          class="w-full text-lg font-semibold bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none"
          placeholder="Environment name"
        >
      </div>

      <div class="p-3 flex-1 overflow-auto">
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Variables</label>
            <button @click="addVariable" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">+ Add Variable</button>
          </div>

          <div v-if="editingEnvironment.variables.length === 0" class="text-center text-zinc-500 py-4 text-sm">
            No variables defined
          </div>

          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-zinc-200 dark:border-zinc-700">
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Enabled</th>
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Key</th>
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Value</th>
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(variable, index) in editingEnvironment.variables" :key="index" class="border-b border-zinc-100 dark:border-zinc-800">
                <td class="p-2">
                  <input
                    type="checkbox"
                    v-model="variable.enabled"
                    class="rounded border-zinc-300 dark:border-zinc-600"
                  >
                </td>
                <td class="p-2">
                  <input
                    v-model="variable.key"
                    placeholder="Key"
                    class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                  >
                </td>
                <td class="p-2">
                  <input
                    v-model="variable.value"
                    placeholder="Value"
                    class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                  >
                </td>
                <td class="p-2">
                  <button @click="removeVariable(index)" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-3 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
        <button @click="saveEnvironment" class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">Save</button>
        <button @click="cancelChanges" class="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-300 rounded">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Environment, Variable } from '../types';
import { useAppStore } from '../stores/app';

const store = useAppStore();

const editingEnvironment = ref<Environment>({
  id: '',
  name: '',
  variables: [],
  active: false
});

const activeEnvironment = computed(() => store.activeEnvironment);

watch(() => store.activeEnvironmentId, (newId) => {
  if (newId) {
    const env = store.environments.find(e => e.id === newId);
    if (env) {
      editingEnvironment.value = { ...env, variables: [...env.variables] };
    }
  } else {
    editingEnvironment.value = {
      id: '',
      name: '',
      variables: [],
      active: false
    };
  }
}, { immediate: true });

function addVariable() {
  editingEnvironment.value.variables.push({
    key: '',
    value: '',
    enabled: true
  });
}

function removeVariable(index: number) {
  editingEnvironment.value.variables.splice(index, 1);
}

function saveEnvironment() {
  if (!editingEnvironment.value.id) return;

  store.updateEnvironment(editingEnvironment.value);
}

function cancelChanges() {
  const env = store.environments.find(e => e.id === store.activeEnvironmentId);
  if (env) {
    editingEnvironment.value = { ...env, variables: [...env.variables] };
  }
}
</script>