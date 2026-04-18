<template>
  <div class="runner-panel bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex-1 flex flex-col overflow-hidden">
    <div v-if="!selectedConfig" class="flex-1 flex items-center justify-center text-zinc-500 dark:text-gray-400">
      <div class="text-center">
        <p class="mb-2">Select a run configuration from the sidebar</p>
        <p class="text-sm">or create a new one</p>
      </div>
    </div>
    <template v-else>
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white">Run: {{ selectedConfig.name }}</h3>
          <div class="flex gap-2">
            <button v-if="!isRunning" class="btn btn-sm bg-green-500 text-white" :disabled="selectedConfig.selectedRequests.length === 0" @click="runCollection">Run</button>
            <button v-else class="btn btn-sm bg-red-500 text-white" @click="stopRun">Stop</button>
          </div>
        </div>
        
        <div class="flex gap-4 mb-4">
          <div class="flex-1">
            <label class="block text-sm text-zinc-600 dark:text-gray-400 mb-1">Collection</label>
            <select v-model="selectedConfig.collectionId" class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
              <option v-for="coll in collections" :key="coll.id" :value="coll.id">{{ coll.name }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm text-zinc-600 dark:text-gray-400 mb-1">Run Mode</label>
            <select v-model="selectedConfig.runMode" class="form-select bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
              <option value="parallel">Parallel</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-4 mb-4">
          <label class="flex items-center gap-2">
            <input v-model="selectedConfig.runRepeated" type="checkbox" class="form-checkbox" />
            <span>Run Repeated</span>
          </label>
          <div v-if="selectedConfig.runRepeated" class="flex items-center gap-2">
            <label class="text-sm text-gray-400">Iterations:</label>
            <input v-model.number="selectedConfig.iterations" type="number" class="form-input bg-zinc-800 text-white border-zinc-600 rounded px-2 py-1" style="width: 80px;" />
          </div>
          <div v-if="selectedConfig.runMode === 'sequential'" class="flex items-center gap-2">
            <label class="text-sm text-gray-400">Delay (ms):</label>
            <input v-model.number="selectedConfig.delay" type="number" class="form-input bg-zinc-800 text-white border-zinc-600 rounded px-2 py-1" style="width: 80px;" />
          </div>
        </div>
      </div>
      
      <div class="flex-1 overflow-auto p-4">
        <div class="mb-4">
          <h4 class="text-sm font-bold mb-2">Select Requests to Run:</h4>
          <div class="border border-zinc-700 rounded max-h-48 overflow-auto">
            <div v-for="req in collectionRequests" :key="req.id" class="p-2 border-b border-zinc-700 hover:bg-zinc-800">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" :value="req.id" v-model="selectedConfig.selectedRequests" />
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

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
  return method === 'get' ? 'bg-green-500' : method === 'post' ? 'bg-blue-500' : method === 'put' ? 'bg-yellow-500 text-black' : method === 'delete' ? 'bg-red-500' : 'bg-cyan-500';
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
  if (!selectedConfig.value) return;
  
  const requests = collectionRequests.value.filter(r => selectedConfig.value!.selectedRequests.includes(r.id));
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

watch(() => selectedConfig.value, (config) => {
  if (config) {
    emit('update-run-config', { ...config });
  }
}, { deep: true });
</script>
