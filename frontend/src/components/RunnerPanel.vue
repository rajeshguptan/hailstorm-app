<template>
  <div class="runner-panel bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex-1 flex flex-col overflow-hidden">
    <div v-if="!selectedConfig" class="flex-1 flex items-center justify-center text-zinc-500 dark:text-gray-400">
      <div class="text-center">
        <p class="mb-2">Select a run configuration from the sidebar</p>
        <p class="text-sm">or create a new one</p>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div class="mb-4">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span v-if="!editMode">{{ selectedConfig?.name }}</span>
            <span v-if="editMode" class="flex items-center gap-1">
              <input v-model="editedName" class="bg-transparent border-b border-zinc-400 dark:border-zinc-600 focus:outline-none text-zinc-900 dark:text-white" />
            </span>
          </h3>
          <div class="flex gap-2 mt-4">
            <button class="btn bg-green-500 text-white" :disabled="isRunning || selectedRequests.length === 0" @click="runCollection">Run</button>
            <button v-if="isRunning" class="btn bg-red-500 text-white" @click="stopRun">Stop</button>
            <button class="btn bg-gray-500 text-white" :disabled="editMode" @click="startEdit">Edit</button>
            <button class="btn bg-blue-500 text-white" :disabled="!editMode" @click="saveConfig">Save</button>
            <button class="btn bg-purple-500 text-white" @click="duplicateConfig">Duplicate</button>
            <button class="btn bg-gray-500 text-white" :disabled="!editMode" @click="cancelEdit">Cancel</button>
          </div>
        </div>
        
        <div class="flex gap-4 mb-4">
          <div class="flex-1">
            <label class="block text-sm text-zinc-600 dark:text-gray-400 mb-1">Collection</label>
            <select v-model="currentCollectionId" :disabled="!editMode" class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
              <option v-for="coll in collections" :key="coll.id" :value="coll.id">{{ coll.name }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm text-zinc-600 dark:text-gray-400 mb-1">Run Mode</label>
            <select v-model="currentRunMode" :disabled="!editMode" class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
              <option value="parallel">Parallel</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>
        </div>

        <div class="flex gap-4 mb-4">
          <label class="flex items-center gap-2">
            <input v-model="currentRunRepeated" :disabled="!editMode" type="checkbox" class="form-checkbox" />
            <span>Run Repeated</span>
          </label>
          <div v-if="currentRunRepeated" class="flex items-center gap-2">
            <label class="text-sm text-zinc-600 dark:text-gray-400">Iterations:</label>
            <input v-model.number="currentIterations" :disabled="!editMode" type="number" class="form-input bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 80px;" />
          </div>
          <div v-if="currentRunMode === 'sequential'" class="flex items-center gap-2">
            <label class="text-sm text-zinc-600 dark:text-gray-400">Delay (ms):</label>
            <input v-model.number="currentDelay" :disabled="!editMode" type="number" class="form-input bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 80px;" />
          </div>
        </div>
      </div>
      
      <div class="flex-1 overflow-auto p-4">
        <div class="mb-4">
          <h4 class="text-sm font-bold mb-2">Select Requests to Run:</h4>
          <div class="border border-zinc-700 rounded max-h-48 overflow-auto">
            <div v-for="req in collectionRequests" :key="req.id" class="p-2 border-b border-zinc-700 hover:bg-zinc-800">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" :value="req.id" v-model="selectedRequests" />
                <span class="badge mr-1" :class="getMethodClass(req)">{{ req.method }}</span>
                <span>{{ req.name }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div v-if="results.length > 0" class="mt-4">
          <h4 class="text-sm font-bold mb-2">Results:</h4>
          <div class="bg-zinc-800 rounded p-2 max-h-64 overflow-auto">
            <div v-for="(result, index) in results" :key="index" class="text-sm mb-1 flex items-center gap-2">
              <span class="badge" :class="getMethodClass(result)">{{ result.method }}</span>
              <span :class="result.status >= 200 && result.status < 300 ? 'text-green-500' : 'text-red-500'">{{ result.status }}</span>
              <span class="text-gray-400">{{ result.name }}</span>
              <span class="text-gray-500">{{ result.time }}ms</span>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-400">
            Passed: {{ passedCount }} / {{ results.length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { RunConfig } from '../types';

interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Variable[];
  body: { type: string; content: string };
  preRequestScript?: string;
  testScript?: string;
  flavors?: Request[];
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
  variables: Variable[];
}

interface RunConfig {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  selectedRequests: string[];
  runMode: 'parallel' | 'sequential';
  delay: number;
  runRepeated: boolean;
  iterations: number;
}

interface RunResult {
  name: string;
  method: string;
  status: number;
  time: number;
}

interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  active: boolean;
}

const props = defineProps<{
  collections: Collection[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  runConfigs: RunConfig[];
  selectedConfigId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update-run-config', config: RunConfig): void;
}>();

const isRunning = ref(false);
const results = ref<RunResult[]>([]);
const lastEmitted = ref<RunConfig | null>(null);
const editMode = ref(false);
const editingConfig = ref<RunConfig | null>(null);
const editedName = ref('');
const selectedRequests = ref<string[]>([]);

const selectedConfig = computed(() => {
  return props.runConfigs.find(c => c.id === props.selectedConfigId) || null;
});

const passedCount = computed(() => {
  return results.value.filter(r => r.status >= 200 && r.status < 300).length;
});

const currentCollection = computed(() => {
  if (!selectedConfig.value) return null;
  return props.collections.find(c => c.id === selectedConfig.value?.collectionId) || null;
});

const collectionRequests = computed(() => {
  if (!currentCollection.value) return [];
  const requests: Request[] = [];
  collectRequests(currentCollection.value.items, requests);
  return requests;
});

const currentCollectionId = computed({
  get: () => editMode.value ? editingConfig.value?.collectionId : selectedConfig.value?.collectionId,
  set: (value: string) => {
    if (editMode.value && editingConfig.value) {
      editingConfig.value.collectionId = value;
    }
  }
});

const currentRunMode = computed({
  get: () => editMode.value ? editingConfig.value?.runMode : selectedConfig.value?.runMode,
  set: (value: 'parallel' | 'sequential') => {
    if (editMode.value && editingConfig.value) {
      editingConfig.value.runMode = value;
    }
  }
});

const currentRunRepeated = computed({
  get: () => editMode.value ? editingConfig.value?.runRepeated : selectedConfig.value?.runRepeated,
  set: (value: boolean) => {
    if (editMode.value && editingConfig.value) {
      editingConfig.value.runRepeated = value;
    }
  }
});

const currentIterations = computed({
  get: () => editMode.value ? editingConfig.value?.iterations : selectedConfig.value?.iterations,
  set: (value: number) => {
    if (editMode.value && editingConfig.value) {
      editingConfig.value.iterations = value;
    }
  }
});

const currentDelay = computed({
  get: () => editMode.value ? editingConfig.value?.delay : selectedConfig.value?.delay,
  set: (value: number) => {
    if (editMode.value && editingConfig.value) {
      editingConfig.value.delay = value;
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

function substituteVariables(text: string): string {
  if (!text) return text;
  const activeEnv = props.environments.find(e => e.id === props.activeEnvironmentId);
  if (!activeEnv) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const variable = activeEnv.variables.find(v => v.key === varName && v.enabled);
    return variable ? variable.value : match;
  });
}

async function runCollection() {
  console.log('[RUNNER_PANEL] runCollection called', { selectedConfig: selectedConfig.value, selectedRequests: selectedRequests.value });
  if (!selectedConfig.value) {
    console.log('[RUNNER_PANEL] No selected config');
    return;
  }
  
  const requests = collectionRequests.value.filter(r => selectedConfig.value!.selectedRequests.includes(r.id));
  console.log('[RUNNER_PANEL] Requests to run:', requests.length, requests.map(r => r.name));
  if (requests.length === 0) return;
  
  isRunning.value = true;
  results.value = [];
  
  const totalIterations = selectedConfig.value.runRepeated ? selectedConfig.value.iterations : 1;
  
  for (let iter = 0; iter < totalIterations; iter++) {
    if (!isRunning.value) break;
    
    if (selectedConfig.value.runMode === 'parallel') {
      const promises = requests.map(req => runSingleRequest(req));
      await Promise.all(promises);
    } else {
      for (let i = 0; i < requests.length; i++) {
        if (!isRunning.value) break;
        await runSingleRequest(requests[i]);
        if (i < requests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, selectedConfig.value!.delay));
        }
      }
    }
    
    if (selectedConfig.value.runRepeated && iter < totalIterations - 1 && selectedConfig.value.runMode === 'sequential') {
      await new Promise(resolve => setTimeout(resolve, selectedConfig.value!.delay));
    }
  }
  
  isRunning.value = false;
}

async function runSingleRequest(req: Request): Promise<RunResult> {
  const url = substituteVariables(req.url);
  const headers: Record<string, string> = {};
  (req.headers || []).forEach(h => {
    headers[substituteVariables(h.key)] = substituteVariables(h.value);
  });
  
  let body = req.body.type !== 'none' ? substituteVariables(req.body.content) : undefined;
  if (req.body.type === 'json' && body) {
    headers['Content-Type'] = 'application/json';
  }
  
  const startTime = Date.now();
  
  try {
    const result = await window.api.makeRequest({
      method: req.method,
      url: url.startsWith('http') ? url : 'https://' + url,
      headers,
      body
    });
    
    const runResult: RunResult = {
      name: req.name,
      method: req.method,
      status: result.status,
      time: result.time
    };
    results.value.push(runResult);
    return runResult;
  } catch (error) {
    const runResult: RunResult = {
      name: req.name,
      method: req.method,
      status: 0,
      time: Date.now() - startTime
    };
    results.value.push(runResult);
    return runResult;
  }
}

function stopRun() {
  isRunning.value = false;
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
      runMode: sourceConfig?.runMode || 'sequential',
      delay: sourceConfig?.delay || 1000,
      runRepeated: sourceConfig?.runRepeated || false,
      iterations: sourceConfig?.iterations || 1
    };
    emit('update-run-config', newConfig);
    editMode.value = false;
    editingConfig.value = null;
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function cancelEdit() {
  editMode.value = false;
  editingConfig.value = null;
}

watch(() => selectedConfig.value, (newConfig) => {
  if (newConfig) {
    selectedRequests.value = [...newConfig.selectedRequests];
  } else {
    selectedRequests.value = [];
  }
  // Reset editing when config changes
  editMode.value = false;
  editingConfig.value = null;
});

watch(selectedRequests, (newVal) => {
  if (selectedConfig.value && JSON.stringify(newVal) !== JSON.stringify(lastEmitted.value?.selectedRequests)) {
    const updated = { ...selectedConfig.value, selectedRequests: newVal };
    lastEmitted.value = JSON.parse(JSON.stringify(updated));
    emit('update-run-config', updated);
  }
}, { deep: true });
</script>
