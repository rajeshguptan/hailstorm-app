<template>
  <div class="request-detail-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div v-if="!selectedRequest" class="p-4 text-center">
      <div class="text-zinc-500">Select a request from the sidebar to view its details.</div>
    </div>

    <div v-else class="flex flex-col h-full">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <input
          v-model="editingRequest.name"
          class="w-full text-lg font-semibold bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none"
          placeholder="Request name"
        >
      </div>

      <div class="p-3 flex-1 overflow-hidden flex flex-col">
        <!-- Method and URL -->
        <div class="mb-4">
          <div class="flex gap-2 mb-2">
            <select v-model="editingRequest.method" class="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            <input
              v-model="editingRequest.url"
              class="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
              placeholder="https://api.example.com/endpoint"
            >
          </div>
        </div>

        <!-- Request Tabs -->
        <div class="flex flex-col flex-1">
          <div class="flex border-b border-zinc-200 dark:border-zinc-700 mb-4">
            <button
              v-for="tab in requestTabs"
              :key="tab.id"
              @click="activeRequestTab = tab.id"
              :class="['px-4 py-2 text-sm font-medium', activeRequestTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']"
            >
              {{ tab.name }}
            </button>
          </div>

          <!-- Params Tab -->
          <div v-if="activeRequestTab === 'params'" class="flex-1 overflow-auto p-3">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Query Parameters</label>
              <button @click="addParam" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">+ Add Param</button>
            </div>
            <div v-if="urlParams.length === 0" class="text-center text-zinc-500 py-4 text-sm">
              No parameters defined
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
                <tr v-for="(param, index) in urlParams" :key="index" class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="p-2">
                    <input type="checkbox" v-model="param.enabled" class="rounded border-zinc-300 dark:border-zinc-600">
                  </td>
                  <td class="p-2">
                    <input v-model="param.key" placeholder="Key" class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm">
                  </td>
                  <td class="p-2">
                    <input v-model="param.value" placeholder="Value" class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm">
                  </td>
                  <td class="p-2">
                    <button @click="removeParam(index)" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Auth Tab -->
          <div v-if="activeRequestTab === 'auth'" class="p-3">
            <div class="mb-4">
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Type</label>
              <select v-model="editingRequest.auth.type" class="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                <option value="noauth">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>

            <div v-if="editingRequest.auth.type === 'bearer'" class="mb-4">
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Token</label>
              <input v-model="editingRequest.auth.bearerToken" type="text" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="Enter bearer token" />
            </div>

            <div v-if="editingRequest.auth.type === 'basic'" class="mb-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Username</label>
                  <input v-model="editingRequest.auth.username" type="text" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="Username" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
                  <input v-model="editingRequest.auth.password" type="password" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="Password" />
                </div>
              </div>
            </div>

            <div v-if="editingRequest.auth.type === 'apikey'" class="mb-4">
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Key</label>
                  <input v-model="editingRequest.auth.apikey.key" type="text" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="Key" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Value</label>
                  <input v-model="editingRequest.auth.apikey.value" type="text" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="Value" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Add to</label>
                  <select v-model="editingRequest.auth.apikey.in" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    <option value="header">Header</option>
                    <option value="query">Query Params</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Headers Tab -->
          <div v-if="activeRequestTab === 'headers'" class="p-3">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Headers</label>
              <button @click="addHeader" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">+ Add Header</button>
            </div>
            <div v-if="requestHeaders.length === 0" class="text-center text-zinc-500 py-4 text-sm">
              No headers defined
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
                <tr v-for="(header, index) in requestHeaders" :key="index" class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="p-2">
                    <input type="checkbox" v-model="header.enabled" class="rounded border-zinc-300 dark:border-zinc-600">
                  </td>
                  <td class="p-2">
                    <input v-model="header.key" placeholder="Header Name" class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm">
                  </td>
                  <td class="p-2">
                    <input v-model="header.value" placeholder="Header Value" class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm">
                  </td>
                  <td class="p-2">
                    <button @click="removeHeader(index)" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

       <!-- Body Tab -->
           <div v-if="activeRequestTab === 'body'" class="flex flex-col h-full">
             <div class="mb-2 px-3">
               <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Request Body</label>
               <select v-model="editingRequest.body.type" class="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                 <option v-if="!editingRequest.isWebSocket" value="none">None</option>
                 <option v-if="!editingRequest.isWebSocket" value="json">JSON</option>
                 <option v-if="!editingRequest.isWebSocket" value="form-data">Form Data</option>
                 <option v-if="!editingRequest.isWebSocket" value="x-www-form-urlencoded">URL Encoded</option>
                 <option v-if="!editingRequest.isWebSocket" value="raw">Raw</option>
                 <option v-if="!editingRequest.isWebSocket" value="binary">Binary</option>
                 <option v-if="editingRequest.isWebSocket" value="json">JSON</option>
                 <option v-if="editingRequest.isWebSocket" value="xml">XML</option>
                 <option v-if="editingRequest.isWebSocket" value="text">Text</option>
               </select>
             </div>
<textarea
                v-if="editingRequest.body.type !== 'none'"
                v-model="editingRequest.body.content"
                class="flex-1 h-full w-full mx-3 mb-3 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
                placeholder="Enter request body..."
              ></textarea>
           </div>

          <!-- Variables Tab -->
          <div v-if="activeRequestTab === 'variables'" class="p-3">
            <div class="flex justify-between items-center mb-4">
              <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Variables</label>
                <p class="text-xs text-zinc-500 mt-1">Set Env to apply a variable only when that environment is active.</p>
              </div>
              <button @click="addVariable" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">+ Add Variable</button>
            </div>
            <div v-if="requestVariables.length === 0" class="text-center text-zinc-500 py-4 text-sm">
              No variables defined
            </div>
            <table v-else class="w-full border-collapse">
              <thead>
                <tr class="border-b border-zinc-200 dark:border-zinc-700">
                  <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Enabled</th>
                  <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Key</th>
                  <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Value</th>
                  <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Env</th>
                  <th class="text-left p-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
<tr v-for="(variable, index) in requestVariables" :key="index" class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="p-2">
                    <input type="checkbox" v-model="variable.enabled" class="rounded border-zinc-300 dark:border-zinc-600">
                  </td>
                  <td class="p-2">
                    <input v-model="variable.key" placeholder="Key" class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm">
                  </td>
                  <td class="p-2">
                    <input v-model="variable.value" placeholder="Value" class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm">
                  </td>
                  <td class="p-2">
                    <select
                      v-model="variable.env"
                      class="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                    >
                      <option value="">All environments</option>
                      <option v-for="environment in environments" :key="environment.id" :value="environment.id">
                        {{ environment.name }}
                      </option>
                    </select>
                  </td>
                  <td class="p-2">
                    <button @click="removeVariable(index)" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Description Tab -->
          <div v-if="activeRequestTab === 'description'" class="p-3">
            <MarkdownDescription v-model="editingRequest.description" />
          </div>

          <!-- Scripts Tab -->
          <div v-if="activeRequestTab === 'scripts'" class="flex flex-col h-full">
            <ScriptTabs :model-value="editingRequest" />
          </div>
        </div>
      </div>

      <div class="p-3 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
        <button @click="saveRequest" class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">Save</button>
        <button @click="sendRequest" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">Send</button>
        <button @click="cancelChanges" class="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-300 rounded">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Request, Variable, RequestVariable } from '../../types';
import { useAppStore } from '../../stores';
import { useRequestsStore } from '../../stores/requests';
import { useResponseStore } from '../../stores/response';
import { useHistoryStore } from '../../stores/history';
import { useUIStore } from '../../stores/ui';
import { useCollectionsStore } from '../../stores/collections';
import { useEnvironmentsStore } from '../../stores/environments';
import { logger } from '../../utils/logger';
import MarkdownDescription from '../editors/MarkdownDescription.vue';
import ScriptTabs from '../editors/ScriptTabs.vue';

const appStore = useAppStore();
const requestsStore = useRequestsStore();
const collectionsStore = useCollectionsStore();
const environmentsStore = useEnvironmentsStore();
const responseStore = useResponseStore();
const historyStore = useHistoryStore();
const uiStore = useUIStore();

const activeRequestTab = ref<'params' | 'auth' | 'headers' | 'body' | 'variables' | 'scripts' | 'description'>('params');

const requestTabs = [
  { id: 'params' as const, name: 'Parameters' },
  { id: 'auth' as const, name: 'Auth' },
  { id: 'headers' as const, name: 'Headers' },
  { id: 'body' as const, name: 'Body' },
  { id: 'variables' as const, name: 'Variables' },
  { id: 'scripts' as const, name: 'Scripts' },
  { id: 'description' as const, name: 'Description' }
];

const editingRequest = ref<Request>({
   id: '',
   name: '',
   method: 'GET',
   url: '',
   headers: [],
   body: { type: 'none', content: '' },
   auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
   preRequestScript: '',
   postRequestScript: '',
   testScript: '',
   variables: [],
   description: ''
  });

const urlParams = ref<Variable[]>([]);
const requestHeaders = ref<Variable[]>([]);
const requestVariables = ref<RequestVariable[]>([]);

const environments = computed(() => environmentsStore.environments);

const selectedRequest = computed(() => editingRequest.value && editingRequest.value.id && requestsStore.selectedRequestId ? true : false);

watch(() => requestsStore.selectedRequestId, (newId) => {
  logger.debug('RequestDetail watcher triggered with newId:', newId);
  if (newId) {
    const item = collectionsStore.findItemById(newId);
    logger.debug('RequestDetail findItemById result:', item);
    if (item) {
      const request = 'request' in item ? item.request : item;
      editingRequest.value = { ...request };
      urlParams.value = requestsStore.extractParams(request.url || '');
      requestHeaders.value = (request.headers && request.headers.length > 0) ? [...request.headers] : [];
      requestVariables.value = (request.variables && request.variables.length > 0) ? [...request.variables] : [];
    }
  } else {
    editingRequest.value = {
      id: '',
      name: '',
      method: 'GET',
      url: '',
      headers: [],
      body: { type: 'none', content: '' },
      auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
      variables: [],
      description: ''
    };
    urlParams.value = [];
    requestHeaders.value = [];
    requestVariables.value = [];
  }
}, { immediate: true });

// Track if request has been modified
watch(() => requestsStore.selectedRequestId, () => {
  if (uiStore.setRequestModified) {
    uiStore.setRequestModified(false);
  } else {
    uiStore.requestModified = false;
  }
});

watch(() => [
  editingRequest.value.url,
  editingRequest.value.method,
  editingRequest.value.body?.content,
  urlParams.value,
  requestHeaders.value,
  requestVariables.value
], () => {
  if (editingRequest.value.id) {
    if (uiStore.setRequestModified) {
      uiStore.setRequestModified(true);
    } else {
      uiStore.requestModified = true;
    }
  }
}, { deep: true });

function addParam() {
  urlParams.value.push({ key: '', value: '', enabled: true });
}

function removeParam(index: number) {
  urlParams.value.splice(index, 1);
}

function addHeader() {
  requestHeaders.value.push({ key: '', value: '', enabled: true });
}

function removeHeader(index: number) {
  requestHeaders.value.splice(index, 1);
}

function addVariable() {
  requestVariables.value.push({ key: '', value: '', enabled: true, env: '' });
}

function removeVariable(index: number) {
  requestVariables.value.splice(index, 1);
}

function saveRequest() {
   if (!editingRequest.value.id) return;

   // Update URL from params
   const urlObj = new URL(editingRequest.value.url || 'http://example.com');
   urlObj.search = '';
   urlParams.value.filter(p => p.enabled).forEach(p => {
     urlObj.searchParams.append(p.key, p.value);
   });
   editingRequest.value.url = urlObj.toString();
   editingRequest.value.headers = [...requestHeaders.value];
   editingRequest.value.variables = [...requestVariables.value];

   // Find and update the request in the collections
   for (const collection of appStore.collections) {
     const updateRequest = (items: any[]): boolean => {
       for (let i = 0; i < items.length; i++) {
         if (items[i].id === editingRequest.value.id && 'method' in items[i]) {
           items[i] = { ...editingRequest.value };
           return true;
         }
         if ('items' in items[i] && items[i].items) {
           if (updateRequest(items[i].items)) {
             return true;
           }
         }
       }
       return false;
     };
     if (updateRequest(collection.items)) {
       break;
     }
   }

   appStore.saveToLocalStorage();
 }

async function sendRequest() {
  logger.debug('Sending request:', editingRequest.value);
  responseStore.isLoading = true;
  const startTime = Date.now();

  try {
    // Prepare request options
    let url = editingRequest.value.url;
    let bodyContent = editingRequest.value.body.type !== 'none' && editingRequest.value.body.content
      ? editingRequest.value.body.content
      : undefined;

    // Substitute variables
    url = substituteRequestVariables(url);
    bodyContent = bodyContent ? substituteRequestVariables(bodyContent) : bodyContent;

    const options = {
      method: editingRequest.value.method,
      url: url,
      headers: {},
      body: bodyContent
    };

    // Add auth headers
    if (editingRequest.value.auth) {
      const auth = editingRequest.value.auth;
      if (auth.type === 'bearer' && auth.bearerToken) {
        options.headers['Authorization'] = `Bearer ${substituteRequestVariables(auth.bearerToken)}`;
      } else if (auth.type === 'basic' && auth.username && auth.password) {
        const username = substituteRequestVariables(auth.username);
        const password = substituteRequestVariables(auth.password);
        const credentials = btoa(`${username}:${password}`);
        options.headers['Authorization'] = `Basic ${credentials}`;
      } else if (auth.type === 'apikey' && auth.apikey) {
        if (auth.apikey.in === 'header') {
          options.headers[substituteRequestVariables(auth.apikey.key)] = substituteRequestVariables(auth.apikey.value);
        } else if (auth.apikey.in === 'query') {
          const urlObj = new URL(options.url);
          urlObj.searchParams.set(substituteRequestVariables(auth.apikey.key), substituteRequestVariables(auth.apikey.value));
          options.url = urlObj.toString();
        }
      }
    }

    // Add headers from the editing request
    requestHeaders.value.forEach(h => {
      if (h.key && h.enabled) {
        options.headers[h.key] = substituteRequestVariables(h.value);
      }
    });

    // Set Content-Type
    if (editingRequest.value.body.type === 'json' && options.body) {
      options.headers['Content-Type'] = 'application/json';
    } else if (editingRequest.value.body.type === 'xml' && options.body) {
      options.headers['Content-Type'] = 'application/xml';
    } else if (editingRequest.value.body.type === 'text' && options.body) {
      options.headers['Content-Type'] = 'text/plain';
    } else if (editingRequest.value.body.type === 'x-www-form-urlencoded' && options.body) {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (editingRequest.value.body.type === 'form-data' && options.body) {
      options.headers['Content-Type'] = 'multipart/form-data';
    }

    // Send request
    const result = await window.api.makeRequest(options);
    const time = Date.now() - startTime;

    responseStore.response = {
      status: result.status,
      statusText: result.statusText,
      data: result.data,
      time: result.time,
      headers: result.headers,
      error: result.error
    };

    // Associate response with current request
    requestsStore.currentRequest.response = responseStore.response;

    // Save the response with the current request to localStorage
    if (!requestsStore.selectedRequestId) {
      requestsStore.saveRequest();
    } else {
      requestsStore.updateCurrentRequest();
    }

    // Add to history
    historyStore.addToHistory({
      id: Date.now(),
      method: editingRequest.value.method,
      url: editingRequest.value.url,
      status: result.status,
      time: result.time,
      timestamp: Date.now(),
      request: JSON.parse(JSON.stringify(editingRequest.value)), // Deep copy of request
      response: responseStore.response!
    });

    uiStore.clearRequestModified();

    responseStore.activeResponseTab = 'body';
  } catch (err: any) {
    responseStore.response = {
      status: 0,
      statusText: 'Error',
      data: err.message || 'Failed to make request',
      time: Date.now() - startTime,
      headers: {},
      error: err.message
    };
  } finally {
    responseStore.isLoading = false;
  }
}

function cancelChanges() {
  const item = collectionsStore.findItemById(requestsStore.selectedRequestId);
  if (item) {
    const request = 'request' in item ? item.request : item;
    editingRequest.value = { ...request };
    urlParams.value = requestsStore.extractParams(request.url || '');
    requestHeaders.value = (request.headers && request.headers.length > 0) ? [...request.headers] : [];
    requestVariables.value = (request.variables && request.variables.length > 0) ? [...request.variables] : [];
  }
}

function substituteRequestVariables(text: string): string {
  if (!text) return text;
  const activeEnvironmentId = environmentsStore.activeEnvironmentId;
  const variables = requestVariables.value.filter(v => v.enabled && (!v.env || v.env === activeEnvironmentId));
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const variable = variables.find(v => v.key === varName);
    return variable ? variable.value : match;
  });
}
</script>