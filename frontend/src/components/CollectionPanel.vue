<template>
  <div class="collection-detail-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div v-if="!selectedCollection" class="p-4 text-center">
      <div class="text-zinc-500">Select a collection from the sidebar to view its details.</div>
    </div>

    <div v-else class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <input
          v-model="editingCollection.name"
          class="w-full text-lg font-semibold bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none"
          placeholder="Collection name"
        >
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-zinc-200 dark:border-zinc-700">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 border-b-2 transition-colors"
          :class="activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-auto">
        <!-- Properties Tab -->
        <div v-if="activeTab === 'properties'" class="p-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Workspace Location</label>
            <div class="flex gap-2">
              <input
                v-model="editingCollection.workspaceLocation"
                class="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="Select workspace directory..."
                readonly
              >
              <button
                @click="selectWorkspaceLocation"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Browse
              </button>
            </div>
            <p class="text-xs text-zinc-500 mt-1">
              Collections and requests will be saved as files in this directory
            </p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Variables</label>
            <button @click="addVariable" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm mb-2">
              + Add Variable
            </button>

            <div v-if="editingCollection.variables.length === 0" class="text-center text-zinc-500 py-4 text-sm">
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
                <tr v-for="(variable, index) in editingCollection.variables" :key="index" class="border-b border-zinc-100 dark:border-zinc-800">
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
                      class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                      placeholder="Key"
                    >
                  </td>
                  <td class="p-2">
                    <input
                      v-model="variable.value"
                      class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                      placeholder="Value"
                    >
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

        <!-- Description Tab -->
        <div v-if="activeTab === 'description'" class="p-4">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
          <textarea
            v-model="editingCollection.description"
            class="w-full h-64 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
            placeholder="Enter collection description..."
          ></textarea>
        </div>

        <!-- Scripts Tab -->
        <div v-if="activeTab === 'scripts'" class="p-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Pre-request Script</label>
            <textarea
              v-model="editingCollection.preRequestScript"
              class="w-full h-32 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
              placeholder="Enter pre-request script..."
            ></textarea>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Test Script</label>
            <textarea
              v-model="editingCollection.testScript"
              class="w-full h-32 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
              placeholder="Enter test script..."
            ></textarea>
          </div>
        </div>

        <!-- Auth Tab -->
        <div v-if="activeTab === 'auth'" class="p-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Authentication Type</label>
            <select
              v-model="editingCollection.auth.type"
              class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="noauth">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="digest">Digest Auth</option>
              <option value="oauth1">OAuth 1.0</option>
              <option value="oauth2">OAuth 2.0</option>
              <option value="apikey">API Key</option>
            </select>
          </div>

          <!-- Bearer Token -->
          <div v-if="editingCollection.auth.type === 'bearer'" class="mb-4">
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Bearer Token</label>
            <input
              v-model="editingCollection.auth.bearerToken"
              type="password"
              class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              placeholder="Enter bearer token"
            >
          </div>

          <!-- Basic Auth -->
          <div v-if="editingCollection.auth.type === 'basic'" class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Username</label>
              <input
                v-model="editingCollection.auth.username"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="Username"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
              <input
                v-model="editingCollection.auth.password"
                type="password"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="Password"
              >
            </div>
          </div>

          <!-- API Key -->
          <div v-if="editingCollection.auth.type === 'apikey'" class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Key</label>
              <input
                v-model="editingCollection.auth.apikey.key"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="API Key name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Value</label>
              <input
                v-model="editingCollection.auth.apikey.value"
                type="password"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="API Key value"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Add to</label>
              <select
                v-model="editingCollection.auth.apikey.in"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-3 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
        <button @click="saveCollection" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">Save</button>
        <button @click="cancelChanges" class="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-300 rounded">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import type { Collection, Variable, Auth } from '../types';

const store = useAppStore();

const activeTab = ref('properties');

const tabs = [
  { id: 'properties', name: 'Properties' },
  { id: 'description', name: 'Description' },
  { id: 'scripts', name: 'Scripts' },
  { id: 'auth', name: 'Auth' }
];

const selectedCollection = computed(() => {
  return store.collections.find(c => c.id === store.selectedCollectionId) || null;
});

const editingCollection = ref<Collection>({
  id: '',
  name: '',
  items: [],
  variables: [],
  description: '',
  workspaceLocation: '',
  preRequestScript: '',
  testScript: '',
  auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } }
});

const initializeEditingCollection = () => {
  if (selectedCollection.value) {
    editingCollection.value = {
      ...selectedCollection.value,
      auth: selectedCollection.value.auth || { type: 'noauth', apikey: { key: '', value: '', in: 'header' } }
    };
  }
};

watch(selectedCollection, () => {
  if (selectedCollection.value) {
    initializeEditingCollection();
    activeTab.value = 'properties';
  }
});

onMounted(() => {
  initializeEditingCollection();
});

const addVariable = () => {
  editingCollection.value.variables.push({ key: '', value: '', enabled: true });
};

const removeVariable = (index: number) => {
  editingCollection.value.variables.splice(index, 1);
};

const selectWorkspaceLocation = async () => {
  try {
    const workspacePath = await window.api.selectWorkspace();
    if (workspacePath) {
      editingCollection.value.workspaceLocation = workspacePath;
      // Auto-save when workspace location is set
      await saveCollection();
    }
  } catch (error) {
    console.error('Failed to select workspace location:', error);
  }
};

const saveCollection = async () => {
  if (selectedCollection.value) {
    store.updateCollection(editingCollection.value);

    // Auto-save to files if workspace location is set
    if (editingCollection.value.workspaceLocation) {
      try {
        const success = await window.api.saveCollectionToFiles(editingCollection.value, editingCollection.value.workspaceLocation);
        if (!success) {
          console.error('Failed to save collection to files');
        }
      } catch (error) {
        console.error('Error saving collection to files:', error);
      }
    }
  }
};

const cancelChanges = () => {
  initializeEditingCollection();
};
</script>