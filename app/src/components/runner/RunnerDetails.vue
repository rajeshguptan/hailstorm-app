<template>
  <div class="runner-panel bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex-1 flex flex-col overflow-hidden" data-testid="runner-panel">
    <div v-if="!selectedConfig" class="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400" data-testid="runner-empty-state">
      <div class="text-center">
        <p class="mb-2">Select a run configuration from the sidebar</p>
        <p class="text-sm">or create a new one</p>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div class="mb-4">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2" data-testid="runner-config-name">
            <span v-if="!editMode">{{ selectedConfig?.name }}</span>
            <span v-if="editMode" class="flex items-center gap-1">
              <input v-model="editedName" class="bg-transparent border-b border-zinc-400 dark:border-zinc-600 focus:outline-none text-zinc-900 dark:text-white" data-testid="runner-config-name-input" />
            </span>
          </h3>
          <div class="flex gap-2 mt-4">
            <button class="btn bg-green-500 text-white" :disabled="isRunning || selectedRequests.length === 0" @click="runCollection" data-testid="runner-run-btn">Run</button>
            <button class="btn bg-red-500 text-white" :disabled="!isRunning" @click="stopRun" data-testid="runner-stop-btn">Stop</button>
            <button class="btn bg-gray-500 text-white" :disabled="editMode" @click="startEdit" data-testid="runner-edit-btn">Edit</button>
            <button class="btn bg-blue-500 text-white" :disabled="!editMode" @click="saveConfig" data-testid="runner-save-btn">Save</button>
            <button class="btn bg-purple-500 text-white" @click="duplicateConfig" data-testid="runner-duplicate-btn">Duplicate</button>
            <button class="btn bg-gray-500 text-white" :disabled="!editMode" @click="cancelEdit" data-testid="runner-cancel-btn">Cancel</button>
          </div>
        </div>

        <div class="flex gap-4 mb-4">
           <div class="flex-1">
             <label class="block text-sm text-zinc-600 dark:text-gray-400 mb-1">Collection</label>
             <select v-model="currentCollectionId" :disabled="!editMode" class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
               <option v-for="coll in collections || []" :key="coll.id" :value="coll.id">{{ coll.name }}</option>
             </select>
           </div>
         </div>

        <div class="flex gap-4 mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="currentRunRepeated" :disabled="!editMode" type="checkbox" class="form-checkbox" />
            <span class="checkbox-label">Run Repeated</span>
          </label>
          <div v-if="currentRunRepeated" class="flex items-center gap-2">
            <label class="text-sm text-zinc-600 dark:text-gray-400">Duration (sec):</label>
            <input v-model.number="currentDuration" :disabled="!editMode" type="number" class="form-input bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 80px;" />
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <div class="flex-1 flex flex-col mb-4">
          <h4 class="text-sm font-bold mb-2">Select Requests to Run:</h4>
          <div class="flex-1 border border-zinc-200 dark:border-zinc-700 rounded overflow-auto">
            <table class="w-full text-sm min-w-full">
              <thead class="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th class="px-2 sm:px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300 w-12 sm:w-16">Select</th>
                  <th class="px-2 sm:px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300 w-16 sm:w-20">Method</th>
                  <th class="px-2 sm:px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300 min-w-0">Name</th>
                   <th class="px-2 sm:px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300 w-20 sm:w-24">RPS</th>
                  <th class="px-2 sm:px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300 min-w-0">Datafile</th>
                </tr>
              </thead>
<tbody>
                 <tr v-for="req in collectionRequests" :key="req.id" class="border-b border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                   <td class="px-2 sm:px-4 py-2">
                     <div :class="selectedRequests.includes(req.id) ? 'checkbox-custom checked' : 'checkbox-custom'" class="form-checkbox" @click="toggleRequest(req.id)"></div>
                   </td>
                   <td class="px-2 sm:px-4 py-2">
                     <span class="badge" :class="getMethodClass(req)">{{ req.method }}</span>
                   </td>
                   <td class="px-2 sm:px-4 py-2 text-zinc-900 dark:text-white truncate">{{ req.name }}</td>
                   <td class="px-2 sm:px-4 py-2">
                     <input
                       v-model.number="requestConfigs[req.id].rps"
                       type="number"
                       min="1"
                       step="1"
                       class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded px-1 sm:px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                       :disabled="!selectedRequests.includes(req.id)"
                       @input="validateRPS(req.id)"
                     />
                   </td>
                   <td class="px-2 sm:px-4 py-2">
                     <div class="flex items-center gap-1 sm:gap-2">
                       <input
                         v-model="requestConfigs[req.id].datafile"
                         type="text"
                         readonly
                         class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm focus:outline-none truncate"
                         :disabled="!selectedRequests.includes(req.id)"
                         placeholder="Select file..."
                       />
                       <button
                         class="px-1 sm:px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap"
                         :disabled="!selectedRequests.includes(req.id)"
                         @click="selectDatafile(req.id)"
                       >
                         Browse
                       </button>
                     </div>
                   </td>
                 </tr>
               </tbody>
            </table>
          </div>
        </div>

        <div v-if="liveStats.totalRequests > 0" class="mt-4">
          <h4 class="text-sm font-bold mb-2">Live Stats:</h4>
          <div class="bg-zinc-800 rounded p-2">
            <div class="text-sm text-gray-400">
              Total: {{ liveStats.totalRequests }} | Passed: {{ liveStats.successfulRequests }} | Failed: {{ liveStats.failedRequests }}
            </div>
            <div class="text-sm text-gray-400">
              Avg Response: {{ Math.round(liveStats.avgResponseTime) }}ms | RPS: {{ Math.round(liveStats.requestsPerSecond) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useLoadTestStore } from '../../stores/loadTest';
import { useRunnerStore } from '../../stores/runner';
import { useAppStore } from '../../stores/index';
import type { RunConfig, RequestConfig } from '../../types';

const loadTestStore = useLoadTestStore();
const runnerStore = useRunnerStore();
const appStore = useAppStore();

onMounted(() => {
  loadTestStore.initialize();
  if (selectedConfig.value) {
    selectedRequests.value = [...selectedConfig.value.selectedRequests];
  }
});

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: any[];
  body: { type: string; content: string };
  preRequestScript?: string;
  postRequestScript?: string;
  testScript?: string;
  flavors?: Request[];
  dependsOn?: string;
}

interface Folder {
  id: string;
  name: string;
  items: (Request | Folder)[];
}

interface Collection {
  id: string;
  name: string;
  items: (Request | Folder)[];
  variables: any[];
}

const props = defineProps<{
  collections: Collection[];
  environments: any[];
  activeEnvironmentId: string | null;
  runConfigs: RunConfig[];
  selectedConfigId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update-run-config', config: RunConfig): void;
}>();

const isRunning = computed(() => runnerStore.isRunning);
const lastEmitted = ref<RunConfig | null>(null);
const editMode = ref(false);
const editingConfig = ref<RunConfig | null>(null);
const editedName = ref('');
const selectedRequests = ref<string[]>([]);
const requestConfigs = ref<Record<string, RequestConfig>>({});
let suppressSelectedRequestsEmit = false;

const selectedConfig = computed(() => {
  if (!props.runConfigs || !props.selectedConfigId) return null;
  return props.runConfigs.find(c => c.id === props.selectedConfigId) || null;
});

const activeConfig = computed<RunConfig | null>(() => {
  if (editMode.value && editingConfig.value) {
    return editingConfig.value;
  }
  return selectedConfig.value;
});

const liveStats = computed(() => loadTestStore.liveStats);

const currentCollection = computed(() => {
  if (!activeConfig.value || !props.collections) return null;
  return props.collections.find(c => c.id === activeConfig.value?.collectionId) || null;
});

const collectionRequests = computed(() => {
  if (!currentCollection.value) return [];
  const requests: Request[] = [];
  collectRequests(currentCollection.value.items, requests);
  return requests;
});

const currentCollectionId = computed({
  get: () => activeConfig.value?.collectionId || '',
  set: (value: string) => {
    const config = activeConfig.value;
    if (!config) return;

    const collection = props.collections.find(c => c.id === value);
    config.collectionId = value;
    config.collectionName = collection?.name || '';
    suppressSelectedRequestsEmit = true;
    selectedRequests.value = [];
    requestConfigs.value = {};
    void nextTick(() => {
      suppressSelectedRequestsEmit = false;
    });
  }
});

const currentRunRepeated = computed({
  get: () => activeConfig.value?.runRepeated || false,
  set: (value: boolean) => {
    if (activeConfig.value) {
      activeConfig.value.runRepeated = value;
    }
  }
});

const currentDuration = computed({
  get: () => activeConfig.value?.duration || 60,
  set: (value: number) => {
    if (activeConfig.value) {
      activeConfig.value.duration = value;
    }
  }
});

function collectRequests(items: (Request | Folder)[], requests: Request[]) {
  for (const item of items) {
    if ('method' in item) {
      requests.push(item as Request);
      if ((item as Request).flavors) {
        requests.push(...(item as Request).flavors!);
      }
    }
    if ('items' in item) {
      collectRequests(item.items, requests);
    }
  }
}

function getMethodClass(item: any): string {
  const method = item.method?.toLowerCase() || 'get';
  return method === 'get' ? 'text-green-800 dark:text-green-200 font-dancing font-bold text-xs' : method === 'post' ? 'text-blue-800 dark:text-blue-200 font-dancing font-bold text-xs' : method === 'put' ? 'text-amber-800 dark:text-amber-200 font-dancing font-bold text-xs' : method === 'delete' ? 'text-red-800 dark:text-red-200 font-dancing font-bold text-xs' : 'text-cyan-800 dark:text-cyan-200 font-dancing font-bold text-xs';
}

function toggleRequest(id: string) {
  const index = selectedRequests.value.indexOf(id);
  if (index > -1) {
    selectedRequests.value.splice(index, 1);
  } else {
    selectedRequests.value.push(id);
  }
}

function validateRPS(requestId: string) {
  const config = requestConfigs.value[requestId];
  if (config.rps < 1 || isNaN(config.rps)) {
    config.rps = 1;
  }
}

async function selectDatafile(requestId: string) {
  try {
    const result = await window.api.showOpenDialog({
      title: 'Select Data File',
      properties: ['openFile'],
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      requestConfigs.value[requestId].datafile = result.filePaths[0];
    }
  } catch (error) {
    console.error('Error selecting datafile:', error);
  }
}

async function runCollection() {
   if (!selectedConfig.value) return;

   const updatedConfig = {
     ...selectedConfig.value,
     requestConfigs: JSON.parse(JSON.stringify(requestConfigs.value)),
     selectedRequests: [...selectedRequests.value]
   };
   lastEmitted.value = JSON.parse(JSON.stringify(updatedConfig));
   emit('update-run-config', updatedConfig);

   const requests = collectionRequests.value.filter(r => updatedConfig.selectedRequests.includes(r.id));
   if (requests.length === 0) return;

    try {
      void runnerStore.runLoadTest(updatedConfig, props.collections, props.environments, props.activeEnvironmentId).catch((error) => {
        console.error('Run failed:', error);
      });
    } catch (error) {
      console.error('Run failed:', error);
    }
  }

async function stopRun() {
  runnerStore.stopRun();
}

function startEdit() {
  if (!selectedConfig.value) return;
  editMode.value = true;
  editingConfig.value = JSON.parse(JSON.stringify(selectedConfig.value));
  editingConfig.value.selectedRequests = [...selectedRequests.value];
  editedName.value = selectedConfig.value.name;
}

function saveConfig() {
  if (!editingConfig.value) return;
  editingConfig.value.name = editedName.value;
  editingConfig.value.selectedRequests = [...selectedRequests.value];
  editingConfig.value.requestConfigs = JSON.parse(JSON.stringify(requestConfigs.value));
  lastEmitted.value = JSON.parse(JSON.stringify(editingConfig.value));
  emit('update-run-config', editingConfig.value);
  editMode.value = false;
  editingConfig.value = null;
}

function duplicateConfig() {
  const sourceConfig = editMode.value ? editingConfig.value : selectedConfig.value;
  if (!sourceConfig) return;

  const newName = prompt('Enter name for new run config:', sourceConfig.name + ' Copy');
  if (newName) {
    const collection = props.collections.find(c => c.id === sourceConfig?.collectionId);
    const newConfig: RunConfig = {
      id: generateId('run'),
      name: newName,
      collectionId: sourceConfig?.collectionId || '',
      collectionName: collection?.name || sourceConfig?.collectionName || '',
      selectedRequests: [...selectedRequests.value],
      runRepeated: sourceConfig?.runRepeated || false,
      duration: sourceConfig?.duration || 60,
      requestConfigs: sourceConfig?.requestConfigs ? JSON.parse(JSON.stringify(sourceConfig.requestConfigs)) : undefined
    };
    emit('update-run-config', newConfig);
    editMode.value = false;
    editingConfig.value = null;
  }
}

function initializeRequestConfigs() {
  const configs: Record<string, RequestConfig> = {};
  const config = activeConfig.value;
  collectionRequests.value.forEach(req => {
    const savedConfig = config?.requestConfigs?.[req.id];
    configs[req.id] = {
      id: req.id,
      rps: savedConfig?.rps || 1,
      datafile: savedConfig?.datafile || ''
    };
  });
  requestConfigs.value = configs;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function cancelEdit() {
  editMode.value = false;
  editingConfig.value = null;
  if (selectedConfig.value) {
    selectedRequests.value = [...selectedConfig.value.selectedRequests];
  }
  initializeRequestConfigs();
}

watch(() => selectedConfig.value, (newConfig) => {
  if (newConfig) {
    selectedRequests.value = [...newConfig.selectedRequests];
    lastEmitted.value = JSON.parse(JSON.stringify(newConfig));
  } else {
    selectedRequests.value = [];
    lastEmitted.value = null;
  }
  editMode.value = false;
  editingConfig.value = null;
}, { immediate: true });

watch(selectedRequests, (newVal) => {
  if (suppressSelectedRequestsEmit || editMode.value) return;

  const config = activeConfig.value;
  if (config && (!lastEmitted.value || JSON.stringify(newVal) !== JSON.stringify(lastEmitted.value.selectedRequests))) {
    const updated = { ...config, selectedRequests: newVal };
    lastEmitted.value = JSON.parse(JSON.stringify(updated));
    emit('update-run-config', updated);
  }
}, { deep: true });

watch(collectionRequests, () => {
  initializeRequestConfigs();
}, { deep: true, immediate: true });
</script>

<style scoped>
.form-checkbox {
  @apply w-4 h-4 rounded border-2 transition-colors duration-200 cursor-pointer;
  background-color: rgb(255 255 255);
  border-color: rgb(161 161 170);
  accent-color: rgb(37 99 235);
}

.dark .form-checkbox {
  background-color: rgb(39 39 42);
  border-color: rgb(82 82 91);
  accent-color: rgb(37 99 235);
}

.checkbox-custom {
  @apply w-4 h-4 rounded border-2 transition-colors duration-200 cursor-pointer;
  background-color: rgb(255 255 255);
  border-color: rgb(161 161 170);
}

.dark .checkbox-custom {
  background-color: rgb(39 39 42);
  border-color: rgb(82 82 91);
}

.checkbox-custom.checked {
  background-color: rgb(37 99 235);
  border-color: rgb(37 99 235);
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 0 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e");
  background-size: 0.75rem;
  background-position: center;
  background-repeat: no-repeat;
}

.checkbox-label {
  @apply text-zinc-900 dark:text-white;
}
</style>
