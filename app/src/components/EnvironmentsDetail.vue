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

      <div class="p-3 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
        <button @click="saveEnvironment" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">Save</button>
        <button @click="cancelChanges" class="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-300 rounded">Cancel</button>
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
                <th class="p-2 w-12 text-xs font-medium text-zinc-500 uppercase tracking-wider">Enabled</th>
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Key</th>
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Value</th>
                <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Collection</th>
                <th class="p-2 w-12 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
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
                  <div class="relative">
                    <input
                      v-model="variable.collection"
                      @input="filterCollections(index, $event)"
                      @focus="showCollectionDropdown(index)"
                      @blur="hideCollectionDropdown"
                      placeholder="All collections"
                      class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                    >
                    <div
                      v-if="activeCollectionDropdown === index"
                      class="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto"
                    >
                      <div
                        v-for="collectionName in filteredCollections(index)"
                        :key="collectionName"
                        @mousedown="selectCollection(index, collectionName)"
                        class="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                      >
                        {{ collectionName }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="p-2">
                  <button @click="removeVariable(index)" class="text-red-500 hover:text-red-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Environment, Variable } from '../types';
import { useEnvironmentsStore } from '../stores/environments';
import { useCollectionsStore } from '../stores/collections';

const environmentsStore = useEnvironmentsStore();
const collectionsStore = useCollectionsStore();

const editingEnvironment = ref<Environment>({
  id: '',
  name: '',
  variables: [],
  active: false
});

const activeEnvironment = computed(() => environmentsStore.activeEnvironment);

const allCollectionNames = computed(() => {
  return collectionsStore.collections.map(c => c.name);
});

const activeCollectionDropdown = ref<number | null>(null);

const filterCollections = (index: number, event: Event) => {
  activeCollectionDropdown.value = index;
};

const showCollectionDropdown = (index: number) => {
  activeCollectionDropdown.value = index;
};

const hideCollectionDropdown = () => {
  setTimeout(() => {
    activeCollectionDropdown.value = null;
  }, 200);
};

const filteredCollections = (index: number) => {
  const search = (editingEnvironment.value.variables[index]?.collection || '').toLowerCase();
  if (!search) return allCollectionNames.value;
  return allCollectionNames.value.filter(name => name.toLowerCase().includes(search));
};

const selectCollection = (index: number, name: string) => {
  if (editingEnvironment.value.variables[index]) {
    editingEnvironment.value.variables[index].collection = name;
  }
  activeCollectionDropdown.value = null;
};

watch(() => environmentsStore.activeEnvironmentId, (newId) => {
  console.log('[DEBUG] EnvironmentsDetail watch triggered, newId:', newId, 'environments length:', environmentsStore.environments.length);
  if (newId) {
    const env = environmentsStore.environments.find(e => e.id === newId);
    if (env) {
      console.log('[DEBUG] Found environment:', env.name, 'variables:', env.variables.length);
      editingEnvironment.value = { ...env, variables: [...env.variables] };
    } else {
      console.log('[DEBUG] Environment not found for id:', newId);
    }
  } else {
    console.log('[DEBUG] No active environment, resetting editingEnvironment');
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
    enabled: true,
    collection: ''
  });
}

function removeVariable(index: number) {
  editingEnvironment.value.variables.splice(index, 1);
}

function saveEnvironment() {
  if (!editingEnvironment.value.id) return;

  environmentsStore.updateEnvironment(editingEnvironment.value);
}

function cancelChanges() {
  const env = environmentsStore.environments.find(e => e.id === environmentsStore.activeEnvironmentId);
  if (env) {
    editingEnvironment.value = { ...env, variables: [...env.variables] };
  }
}
</script>