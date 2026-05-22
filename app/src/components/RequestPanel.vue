<template>
  <div class="request-panel bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white p-3 border-b border-zinc-200 dark:border-zinc-700">
    <!-- First row: Request name and action buttons -->
    <div class="flex gap-2 mb-2 items-center">
      <input v-model="name" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 flex-1" placeholder="Request Name" />
      <select v-model="dependsOn" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 150px;">
        <option value="">No dependency</option>
        <option v-for="req in validDependencyOptions" :key="req.id" :value="req.id">{{ req.name }}</option>
      </select>
      <button class="px-3 py-1.5 border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm" @click="copyToClipboard">
        📋 Copy
      </button>
      <div class="relative">
        <button class="px-3 py-1.5 border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm" @click="toggleSaveMenu">Save ▾</button>
        <div v-if="showSaveMenu" class="absolute right-0 mt-1 w-32 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg z-10">
          <button class="block w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" @click="saveRequest">Save</button>
          <button class="block w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" @click="saveNewRequest">Save New</button>
        </div>
      </div>
      <button class="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm" :disabled="responseStore.isLoading" @click="sendRequest">
        {{ responseStore.isLoading ? 'Sending...' : 'Send' }}
      </button>
    </div>

    <!-- Second row: Method and URL -->
    <div class="flex gap-2 mb-2">
      <select v-model="method" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 100px;">
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input v-model="url" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 flex-1" placeholder="Enter request URL" @keyup.enter="sendRequest" />
    </div>
    
    <ul class="flex border-b border-zinc-200 dark:border-zinc-700" role="tablist">
      <li>
         <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'params' }" @click="requestsStore.activeRequestTab = 'params'">Parameters</button>

        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'auth' }" @click="requestsStore.activeRequestTab = 'auth'">Auth</button>

        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'headers' }" @click="requestsStore.activeRequestTab = 'headers'">Headers</button>

         <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'body' }" @click="requestsStore.activeRequestTab = 'body'">Body</button>

          <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'variables' }" @click="requestsStore.activeRequestTab = 'variables'">Variables</button>

          <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'scripts' }" @click="requestsStore.activeRequestTab = 'scripts'">Scripts</button>
       </li>
    </ul>
    
    <div class="tab-content p-2" style="max-height: 200px; overflow-y: auto;">
      <div v-if="requestsStore.activeRequestTab === 'params'" class="key-value-editor">
        <div class="flex gap-2 mb-2">
          <span class="flex-1 text-sm text-zinc-500">Key</span>
          <span class="flex-1 text-sm text-zinc-500">Value</span>
          <span style="width: 30px;"></span>
        </div>
        <div v-for="(param, index) in requestsStore.urlParams" :key="index" class="flex gap-2 mb-1">
          <input v-model="param.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Key" @input="requestsStore.updateUrlFromParams()" />
          <input v-model="param.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Value" @input="requestsStore.updateUrlFromParams()" />
          <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="requestsStore.removeParam(index)">×</button>
        </div>
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="requestsStore.addParam()">+ Add Parameter</button>
      </div>

      <div v-if="requestsStore.activeRequestTab === 'auth'" class="auth-editor">
        <div class="mb-4">
          <label class="block text-sm text-zinc-500 mb-2">Type</label>
          <select v-model="requestsStore.currentRequest.auth.type" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
            <option value="noauth">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="apikey">API Key</option>
          </select>
        </div>

        <div v-if="requestsStore.currentRequest.auth.type === 'bearer'" class="mb-4">
          <label class="block text-sm text-zinc-500 mb-2">Token</label>
          <input v-model="requestsStore.currentRequest.auth.bearerToken" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 w-full" placeholder="Enter bearer token" />
        </div>

        <div v-if="requestsStore.currentRequest.auth.type === 'basic'" class="mb-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Username</label>
              <input v-model="requestsStore.currentRequest.auth.username" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Username" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Password</label>
              <input v-model="requestsStore.currentRequest.auth.password" type="password" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Password" />
            </div>
          </div>
        </div>

        <div v-if="requestsStore.currentRequest.auth.type === 'apikey'" class="mb-4">
          <div class="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Key</label>
              <input v-model="requestsStore.currentRequest.auth.apikey.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Key" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Value</label>
              <input v-model="requestsStore.currentRequest.auth.apikey.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Value" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Add to</label>
              <select v-model="requestsStore.currentRequest.auth.apikey.in" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div v-if="requestsStore.activeRequestTab === 'headers'" class="key-value-editor">
        <div class="flex gap-2 mb-2">
          <span class="flex-1 text-sm text-zinc-500">Key</span>
          <span class="flex-1 text-sm text-zinc-500">Value</span>
          <span style="width: 30px;"></span>
        </div>
        <div v-for="(header, index) in requestsStore.requestHeaders" :key="index" class="flex gap-2 mb-1">
          <input v-model="header.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Key" />
          <input v-model="header.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Value" />
          <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="requestsStore.removeHeader(index)">×</button>
        </div>
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="requestsStore.addHeader()">+ Add Header</button>
      </div>
      
      <div v-if="requestsStore.activeRequestTab === 'body'">
        <div class="mb-2">
          <select v-model="requestsStore.currentRequest.body.type" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
            <option value="none">None</option>
            <option value="form-data">Form Data</option>
            <option value="x-www-form-urlencoded">URL Encoded</option>
            <option value="raw">Raw</option>
            <option value="binary">Binary</option>
          </select>
        </div>
        <div v-if="requestsStore.currentRequest.body.type !== 'none'" class="mt-2">
          <textarea v-model="requestsStore.currentRequest.body.content" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded w-full" rows="5" placeholder='{"key": "value"}'></textarea>
        </div>
       </div>

        <div v-if="requestsStore.activeRequestTab === 'variables'" class="key-value-editor">
          <div class="flex gap-2 mb-2">
            <span style="width: 30px;"></span>
            <span class="flex-1 text-sm text-zinc-500">Key</span>
            <span class="flex-1 text-sm text-zinc-500">Value</span>
            <div class="flex items-center flex-1">
              <span class="text-sm text-zinc-500 mr-2">Dataset</span>
              <select v-model="selectedDataset" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1">
                <option value="">All</option>
                <option v-for="dataset in uniqueDatasets" :key="dataset" :value="dataset">{{ dataset }}</option>
              </select>
            </div>
            <span style="width: 30px;"></span>
          </div>
         <div v-for="(variable, index) in filteredVariables" :key="index" class="flex gap-2 mb-1">
           <input type="checkbox" v-model="variable.enabled" class="rounded border-zinc-300 dark:border-zinc-600">
           <input v-model="variable.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Key" />
           <input v-model="variable.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Value" />
           <input v-model="variable.dataset" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Dataset" />
           <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="removeVariable(index)">×</button>
         </div>
          <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="addVariable()">+ Add Variable</button>
        </div>



        <div v-if="requestsStore.activeRequestTab === 'scripts'">
        <div class="mb-2">
          <label class="block text-sm text-zinc-500 mb-1">Pre-request Script</label>
          <textarea v-model="requestsStore.currentRequest.preRequestScript" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded font-mono w-full" rows="3" placeholder="// Runs before request is sent"></textarea>
        </div>
        <div>
          <label class="block text-sm text-zinc-500 mb-1">Test Script</label>
          <textarea v-model="requestsStore.currentRequest.testScript" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded font-mono w-full" rows="3" placeholder="// Runs after response is received"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, computed, ref } from 'vue';
import { useRequestsStore } from '../stores/requests';
import { useEnvironmentsStore } from '../stores/environments';
import { useResponseStore } from '../stores/response';
import { useCollectionsStore } from '../stores/collections';
import { useHistoryStore } from '../stores/history';
import { useSecretsStore } from '../stores/secrets';
import { useAppStore } from '../stores';
import type { SendRequestContext } from '../types';

const requestsStore = useRequestsStore();
const environmentsStore = useEnvironmentsStore();
const responseStore = useResponseStore();
const historyStore = useHistoryStore();
const collectionsStore = useCollectionsStore();
const secretsStore = useSecretsStore();
const appStore = useAppStore();
const selectedDataset = ref<string>('');
const showSaveMenu = ref<boolean>(false);

function toggleSaveMenu() {
  showSaveMenu.value = !showSaveMenu.value;
}

async function copyToClipboard() {
  try {
    const markdown = generateMarkdown();
    await navigator.clipboard.writeText(markdown);
    // Could add a toast notification here
    console.log('Copied to clipboard');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
}

function generateMarkdown(): string {
  const req = requestsStore.currentRequest;
  let markdown = `# ${req.method} ${req.url}\n\n`;

  // URL Parameters
  if (requestsStore.urlParams && requestsStore.urlParams.length > 0) {
    markdown += `## URL Parameters\n\n`;
    requestsStore.urlParams.forEach(param => {
      if (param.enabled) {
        markdown += `- **${param.key}**: ${param.value}\n`;
      }
    });
    markdown += `\n`;
  }

  // Headers
  if (req.headers && req.headers.length > 0) {
    markdown += `## Headers\n\n`;
    req.headers.forEach(header => {
      if (header.enabled) {
        markdown += `- **${header.key}**: ${header.value}\n`;
      }
    });
    markdown += `\n`;
  }

  // Body
  if (req.body && req.body.type !== 'none' && req.body.content) {
    markdown += `## Request Body\n\n`;
    if (req.body.type === 'json') {
      markdown += `\`\`\`json\n${req.body.content}\n\`\`\`\n\n`;
    } else {
      markdown += `\`\`\`\n${req.body.content}\n\`\`\`\n\n`;
    }
  }

  // Response
  if (responseStore.response) {
    const res = responseStore.response;
    markdown += `## Response\n\n`;
    markdown += `**Status**: ${res.status} ${res.statusText}\n`;
    markdown += `**Time**: ${res.time}ms\n\n`;

    // Response Headers
    if (res.headers) {
      markdown += `### Response Headers\n\n`;
      Object.entries(res.headers).forEach(([key, value]) => {
        markdown += `- **${key}**: ${Array.isArray(value) ? value.join(', ') : value}\n`;
      });
      markdown += `\n`;
    }

    // Response Body
    if (res.data) {
      markdown += `### Response Body\n\n`;
      try {
        const parsed = JSON.parse(res.data);
        markdown += `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`\n`;
      } catch {
        markdown += `\`\`\`\n${res.data}\n\`\`\`\n`;
      }
    }
  }

  return markdown;
}

watch(
  () => requestsStore.currentRequest,
  (newVal) => {
    console.log('RequestPanel watch: currentRequest changed:', newVal.name, newVal.url);
  },
  { deep: true, immediate: true }
);

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const method = computed({
  get: () => requestsStore.currentRequest.method,
  set: (val) => { requestsStore.currentRequest.method = val; }
});

const url = computed({
  get: () => {
    const currentUrl = requestsStore.currentRequest.url;
    console.log('[RequestPanel] url getter:', currentUrl);
    return currentUrl;
  },
  set: (val) => {
    console.log('[RequestPanel] url setter:', val);
    requestsStore.currentRequest.url = val;
  }
});

const name = computed({
  get: () => requestsStore.currentRequest.name,
  set: (val) => { requestsStore.currentRequest.name = val; }
});

const dependsOn = computed({
  get: () => requestsStore.currentRequest.dependsOn || '',
  set: (val) => { requestsStore.currentRequest.dependsOn = val || undefined; }
});

// Get all requests in the current collection (excluding the current request)
const collectionRequests = computed(() => {
  const currentCollection = collectionsStore.selectedCollection;
  if (!currentCollection) return [];

  const allRequests: any[] = [];

  function collectRequests(items: any[]) {
    for (const item of items) {
      if (item.method && item.url) { // It's a request
        if (item.id !== requestsStore.selectedRequestId) { // Exclude current request
          allRequests.push(item);
        }
      } else if (item.items) { // It's a folder
        collectRequests(item.items);
      }
    }
  }

  collectRequests(currentCollection.items);
  return allRequests;
});

// Check for circular dependencies
function hasCircularDependency(startRequestId: string, targetRequestId: string, visited = new Set<string>()): boolean {
  if (visited.has(startRequestId)) {
    return true; // Circular dependency detected
  }

  visited.add(startRequestId);

  // Find the request
  const request = collectionRequests.value.find((req: any) => req.id === startRequestId) ||
                  (requestsStore.selectedRequestId === startRequestId ? requestsStore.currentRequest : null);

  if (!request || !request.dependsOn) {
    return false;
  }

  // If this request depends on the target, it's a cycle
  if (request.dependsOn === targetRequestId) {
    return true;
  }

  return hasCircularDependency(request.dependsOn, targetRequestId, visited);
}

// Computed property for valid dependency options (no circular dependencies)
const validDependencyOptions = computed(() => {
  return collectionRequests.value.filter((req: any) => {
    // Check if selecting this request would create a circular dependency
    // We want to check if following dependencies from req.id leads back to current request
    const currentId = requestsStore.selectedRequestId || requestsStore.currentRequest.id;
    return !hasCircularDependency(req.id, currentId || '');
  });
});

watch(() => requestsStore.selectedRequestId, () => {
  console.log('[RequestPanel] selectedRequestId changed to:', requestsStore.selectedRequestId);
  if (requestsStore.selectedRequestId) {
    const request = requestsStore.selectedRequest;
    console.log('[RequestPanel] selectedRequest:', request);
    if (request) {
      console.log('[RequestPanel] Setting variables from request');
      requestsStore.currentRequest.variables = request.variables || [];
    }
  }
});

const uniqueDatasets = computed(() => {
  const datasets = new Set<string>();
  if (requestsStore.currentRequest.variables) {
    requestsStore.currentRequest.variables.forEach(v => {
      if (v.dataset) datasets.add(v.dataset);
    });
  }
  return Array.from(datasets);
});

const filteredVariables = computed(() => {
  if (!selectedDataset.value) {
    return requestsStore.currentRequest.variables || [];
  }
  return (requestsStore.currentRequest.variables || []).filter(v => v.dataset === selectedDataset.value);
});

// async sendRequest: delegate all execution logic to the execution engine.
// The engine handles variable substitution, dependency resolution, auth/header
// construction, the HTTP call, history recording and test-script evaluation.
async function sendRequest() {
  console.log('[SEND] sendRequest called');
  responseStore.isLoading = true;

  try {
    const context: SendRequestContext = {
      requestsStore: {
        currentRequest: JSON.parse(JSON.stringify(requestsStore.currentRequest)),
        requestHeaders: JSON.parse(JSON.stringify(requestsStore.requestHeaders)),
        urlParams: JSON.parse(JSON.stringify(requestsStore.urlParams)),
        activeRequestTab: requestsStore.activeRequestTab,
      },
      responseStore: {
        response: JSON.parse(JSON.stringify(responseStore.response)),
        testResults: responseStore.testResults,
        activeResponseTab: responseStore.activeResponseTab,
        isLoading: responseStore.isLoading,
      },
      historyStore: {
        history: JSON.parse(JSON.stringify(historyStore.history ?? [])),
      },
      environmentsStore: {
        environments: JSON.parse(JSON.stringify(environmentsStore.environments ?? [])),
        activeEnvironmentId: environmentsStore.activeEnvironmentId,
      },
      appStore: {
        secrets: JSON.parse(JSON.stringify(appStore.secrets ?? [])),
        selectedSecretId: appStore.selectedSecretId,
      },
      collectionsStore: {
        collections: JSON.parse(JSON.stringify(collectionsStore.collections ?? [])),
        selectedCollectionId: collectionsStore.selectedCollectionId,
      },
      secretsStore: {
        isUnlocked: secretsStore.isUnlocked,
      },
    };

    const result = await window.api.sendRequest(context);

    // ── Apply response ────────────────────────────────────────────────────
    responseStore.response = {
      status: result.response.status,
      statusText: result.response.statusText,
      data: result.response.data,
      time: result.response.time,
      headers: result.response.headers,
      error: result.response.error,
    };

    if (requestsStore.selectedRequestId) {
      requestsStore.currentRequest.response = responseStore.response;
      requestsStore.updateCurrentRequest();
    } else {
      requestsStore.currentRequest = {
        ...requestsStore.currentRequest,
        response: responseStore.response,
      };
      requestsStore.saveRequest();
    }

    // ── Apply dependency responses ────────────────────────────────────────
    for (const dep of result.executedDependencies) {
      const depItem = collectionsStore.findItemById(dep.id);
      if (depItem) {
        if ('request' in depItem) {
          depItem.request.response = {
            status: dep.status, statusText: dep.statusText, data: '', time: dep.time,
            headers: {}, error: dep.error,
          };
        } else {
          depItem.response = {
            status: dep.status, statusText: dep.statusText, data: '', time: dep.time,
            headers: {}, error: dep.error,
          };
        }
        collectionsStore.saveCollections();
      }
    }

    // ── Apply history ─────────────────────────────────────────────────────
    for (const entry of result.historyEntries) {
      historyStore.addToHistory(entry);
    }

    // ── Test results ──────────────────────────────────────────────────────
    responseStore.testResults = result.testResults;
    responseStore.activeResponseTab = 'body';

    console.log('[SEND] sendRequest completed successfully');
  } catch (err: any) {
    const startTime = Date.now();
    console.error('[SEND] Error:', err);
    responseStore.response = {
      status: 0,
      statusText: 'Error',
      data: err.message || 'Failed to make request',
      time: Date.now() - startTime,
      headers: {},
      error: err.message,
    };
    responseStore.testResults = '';
  } finally {
    responseStore.isLoading = false;
  }
}

function addVariable() {
  if (!requestsStore.currentRequest.variables) {
    requestsStore.currentRequest.variables = [];
  }
  requestsStore.currentRequest.variables.push({
    key: '',
    value: '',
    dataset: '',
    enabled: true,
  });
}

function removeVariable(index: number) {
  const variable = filteredVariables.value[index];
  const realIndex = requestsStore.currentRequest.variables.indexOf(variable);
  if (realIndex > -1) {
    requestsStore.currentRequest.variables.splice(realIndex, 1);
  }
}

function saveRequest() {
  showSaveMenu.value = false;
  console.log('saveRequest called, currentRequest.id:', requestsStore.currentRequest.id);
  if (requestsStore.currentRequest.id) {
    console.log('Calling updateCurrentRequest');
    requestsStore.updateCurrentRequest();
  } else {
    console.log('Calling saveRequest (new)');
    requestsStore.saveRequest();
  }
}

function saveNewRequest() {
  showSaveMenu.value = false;
  requestsStore.saveRequest();
}
</script>
