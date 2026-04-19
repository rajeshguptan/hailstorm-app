<template>
  <div class="request-panel bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white p-3 border-b border-zinc-200 dark:border-zinc-700">
    <div class="url-bar flex gap-2 mb-2">
      <select v-model="method" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 100px;">
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input v-model="url" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 flex-1" placeholder="Enter request URL" @keyup.enter="sendRequest" />
      <button class="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm" :disabled="store.isLoading" @click="sendRequest">
        {{ store.isLoading ? 'Sending...' : 'Send' }}
      </button>
      <div class="relative">
        <button class="px-3 py-1.5 border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm" @click="toggleSaveMenu">Save ▾</button>
        <div v-if="showSaveMenu" class="absolute right-0 mt-1 w-32 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg z-10">
          <button class="block w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" @click="saveRequest">Save</button>
          <button class="block w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" @click="saveNewRequest">Save New</button>
        </div>
      </div>
    </div>
    
    <div class="mb-2">
      <input v-model="name" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 w-full" placeholder="Request Name" />
    </div>
    
    <ul class="flex border-b border-zinc-200 dark:border-zinc-700" role="tablist">
      <li>
         <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeRequestTab === 'params' }" @click="store.activeRequestTab = 'params'">Parameters</button>
      </li>
      <li>
        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeRequestTab === 'auth' }" @click="store.activeRequestTab = 'auth'">Auth</button>
      </li>
      <li>
        <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeRequestTab === 'headers' }" @click="store.activeRequestTab = 'headers'">Headers</button>
      </li>
       <li>
         <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeRequestTab === 'body' }" @click="store.activeRequestTab = 'body'">Body</button>
       </li>
       <li>
         <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeRequestTab === 'variables' }" @click="store.activeRequestTab = 'variables'">Variables</button>
       </li>
       <li>
         <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': store.activeRequestTab === 'scripts' }" @click="store.activeRequestTab = 'scripts'">Scripts</button>
       </li>
    </ul>
    
    <div class="tab-content p-2" style="max-height: 200px; overflow-y: auto;">
      <div v-if="store.activeRequestTab === 'params'" class="key-value-editor">
        <div class="flex gap-2 mb-2">
          <span class="flex-1 text-sm text-zinc-500">Key</span>
          <span class="flex-1 text-sm text-zinc-500">Value</span>
          <span style="width: 30px;"></span>
        </div>
        <div v-for="(param, index) in store.urlParams" :key="index" class="flex gap-2 mb-1">
          <input v-model="param.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Key" @input="store.updateUrlFromParams()" />
          <input v-model="param.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Value" @input="store.updateUrlFromParams()" />
          <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="store.removeParam(index)">×</button>
        </div>
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="store.addParam()">+ Add Parameter</button>
      </div>

      <div v-if="store.activeRequestTab === 'auth'" class="auth-editor">
        <div class="mb-4">
          <label class="block text-sm text-zinc-500 mb-2">Type</label>
          <select v-model="store.currentRequest.auth.type" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
            <option value="noauth">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="apikey">API Key</option>
          </select>
        </div>

        <div v-if="store.currentRequest.auth.type === 'bearer'" class="mb-4">
          <label class="block text-sm text-zinc-500 mb-2">Token</label>
          <input v-model="store.currentRequest.auth.bearerToken" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 w-full" placeholder="Enter bearer token" />
        </div>

        <div v-if="store.currentRequest.auth.type === 'basic'" class="mb-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Username</label>
              <input v-model="store.currentRequest.auth.username" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Username" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Password</label>
              <input v-model="store.currentRequest.auth.password" type="password" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Password" />
            </div>
          </div>
        </div>

        <div v-if="store.currentRequest.auth.type === 'apikey'" class="mb-4">
          <div class="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Key</label>
              <input v-model="store.currentRequest.auth.apikey.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Key" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Value</label>
              <input v-model="store.currentRequest.auth.apikey.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Value" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Add to</label>
              <select v-model="store.currentRequest.auth.apikey.in" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div v-if="store.activeRequestTab === 'headers'" class="key-value-editor">
        <div class="flex gap-2 mb-2">
          <span class="flex-1 text-sm text-zinc-500">Key</span>
          <span class="flex-1 text-sm text-zinc-500">Value</span>
          <span style="width: 30px;"></span>
        </div>
        <div v-for="(header, index) in store.requestHeaders" :key="index" class="flex gap-2 mb-1">
          <input v-model="header.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Key" />
          <input v-model="header.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Value" />
          <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="store.removeHeader(index)">×</button>
        </div>
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="store.addHeader()">+ Add Header</button>
      </div>
      
      <div v-if="store.activeRequestTab === 'body'">
        <div class="mb-2">
          <select v-model="store.currentRequest.body.type" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
            <option value="none">None</option>
            <option value="form-data">Form Data</option>
            <option value="x-www-form-urlencoded">URL Encoded</option>
            <option value="raw">Raw</option>
            <option value="binary">Binary</option>
          </select>
        </div>
        <div v-if="store.currentRequest.body.type !== 'none'" class="mt-2">
          <textarea v-model="store.currentRequest.body.content" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded w-full" rows="5" placeholder='{"key": "value"}'></textarea>
        </div>
       </div>

        <div v-if="store.activeRequestTab === 'variables'" class="key-value-editor">
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

       <div v-if="store.activeRequestTab === 'scripts'">
        <div class="mb-2">
          <label class="block text-sm text-zinc-500 mb-1">Pre-request Script</label>
          <textarea v-model="store.currentRequest.preRequestScript" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded font-mono w-full" rows="3" placeholder="// Runs before request is sent"></textarea>
        </div>
        <div>
          <label class="block text-sm text-zinc-500 mb-1">Test Script</label>
          <textarea v-model="store.currentRequest.testScript" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded font-mono w-full" rows="3" placeholder="// Runs after response is received"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, computed, ref } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();
const selectedDataset = ref<string>('');
const showSaveMenu = ref<boolean>(false);

function toggleSaveMenu() {
  showSaveMenu.value = !showSaveMenu.value;
}

watch(
  () => store.currentRequest,
  (newVal) => {
    console.log('RequestPanel watch: currentRequest changed:', newVal.name, newVal.url);
  },
  { deep: true, immediate: true }
);

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const method = computed({
  get: () => store.currentRequest.method,
  set: (val) => { store.currentRequest.method = val; }
});

const url = computed({
  get: () => {
    const currentUrl = store.currentRequest.url;
    console.log('[RequestPanel] url getter:', currentUrl);
    return currentUrl;
  },
  set: (val) => {
    console.log('[RequestPanel] url setter:', val);
    store.currentRequest.url = val;
  }
});

const name = computed({
  get: () => store.currentRequest.name,
  set: (val) => { store.currentRequest.name = val; }
});

watch(() => store.selectedRequestId, () => {
  console.log('[RequestPanel] selectedRequestId changed to:', store.selectedRequestId);
  if (store.selectedRequestId) {
    const request = store.selectedRequest;
    console.log('[RequestPanel] selectedRequest:', request);
    if (request) {
      console.log('[RequestPanel] Setting variables from request');
      store.currentRequest.variables = request.variables || [];
    }
  }
});

const uniqueDatasets = computed(() => {
  const datasets = new Set<string>();
  (store.currentRequest.variables || []).forEach(v => {
    if (v.dataset) datasets.add(v.dataset);
  });
  return Array.from(datasets).sort();
});

const filteredVariables = computed(() => {
  if (!selectedDataset.value) {
    return store.currentRequest.variables || [];
  }
  return (store.currentRequest.variables || []).filter(v => v.dataset === selectedDataset.value);
});

function substituteVariables(text: string): string {
  if (!text) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    // First check environment variables
    if (store.activeEnvironment && store.activeEnvironment.variables) {
      const envVar = store.activeEnvironment.variables.find(v => v.key === varName);
      if (envVar) {
        return envVar.value;
      }
    }

    // Then check request variables
    if (store.currentRequest.variables) {
      const variables = selectedDataset.value
        ? store.currentRequest.variables.filter(v => v.enabled && v.dataset === selectedDataset.value)
        : store.currentRequest.variables.filter(v => v.enabled);
      const reqVar = variables.find(v => v.key === varName);
      if (reqVar) {
        return reqVar.value;
      }
    }

    // Return original match if no variable found
    return match;
  });
}

async function sendRequest() {
    store.isLoading = true;
    const startTime = Date.now();

    try {
        // Prepare request options for execution engine
        let url = store.currentRequest.url;
        let bodyContent = store.currentRequest.body.type !== 'none' && store.currentRequest.body.content
            ? store.currentRequest.body.content
            : undefined;

        // Substitute variables
        url = substituteVariables(url);
        bodyContent = bodyContent ? substituteVariables(bodyContent) : bodyContent;

        const options = {
            method: store.currentRequest.method,
            url: url,
            headers: {},
            body: bodyContent
        };

        // Create a substituted copy of the request for history
        const substitutedRequest = JSON.parse(JSON.stringify(store.currentRequest));
        substitutedRequest.url = url;
        if (bodyContent !== undefined) {
          substitutedRequest.body.content = bodyContent;
        }
        // Substitute auth fields
        if (substitutedRequest.auth) {
          const auth = substitutedRequest.auth;
          if (auth.type === 'bearer' && auth.bearerToken) {
            auth.bearerToken = substituteVariables(auth.bearerToken);
          } else if (auth.type === 'basic') {
            if (auth.username) auth.username = substituteVariables(auth.username);
            if (auth.password) auth.password = substituteVariables(auth.password);
          } else if (auth.type === 'apikey' && auth.apikey) {
            auth.apikey.key = substituteVariables(auth.apikey.key);
            auth.apikey.value = substituteVariables(auth.apikey.value);
          }
        }
        // Substitute header values
        if (substitutedRequest.headers) {
          substitutedRequest.headers.forEach(h => {
            if (h.value) h.value = substituteVariables(h.value);
          });
        }
        
        // Add auth headers/params
        if (store.currentRequest.auth) {
            const auth = store.currentRequest.auth;
            if (auth.type === 'bearer' && auth.bearerToken) {
                options.headers['Authorization'] = `Bearer ${substituteVariables(auth.bearerToken)}`;
            } else if (auth.type === 'basic' && auth.username && auth.password) {
                const username = substituteVariables(auth.username);
                const password = substituteVariables(auth.password);
                const credentials = btoa(`${username}:${password}`);
                options.headers['Authorization'] = `Basic ${credentials}`;
            } else if (auth.type === 'apikey' && auth.apikey) {
                if (auth.apikey.in === 'header') {
                    options.headers[substituteVariables(auth.apikey.key)] = substituteVariables(auth.apikey.value);
                } else if (auth.apikey.in === 'query') {
                    const urlObj = new URL(options.url);
                    urlObj.searchParams.set(substituteVariables(auth.apikey.key), substituteVariables(auth.apikey.value));
                    options.url = urlObj.toString();
                }
            }
        }

        // Add headers
        store.requestHeaders.forEach(h => {
            if (h.key && h.enabled) {
                options.headers[h.key] = substituteVariables(h.value);
            }
        });
        
        // Set Content-Type based on body type
        if (store.currentRequest.body.type === 'json' && options.body) {
            options.headers['Content-Type'] = 'application/json';
        } else if (store.currentRequest.body.type === 'x-www-form-urlencoded' && options.body) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else if (store.currentRequest.body.type === 'form-data' && options.body) {
            options.headers['Content-Type'] = 'multipart/form-data';
        }
        
        // Call execution engine via IPC
        const result = await window.api.makeRequest(options);
        const time = Date.now() - startTime;
        
        store.response = {
            status: result.status,
            statusText: result.statusText,
            data: result.data,
            time: result.time,
            headers: result.headers,
            error: result.error
        };
        
        // Add to history
        store.addToHistory({
            id: Date.now(),
            method: store.currentRequest.method,
            url: options.url,
            status: result.status,
            time: result.time,
            request: substitutedRequest,
            response: store.response!
        });
        
        // Execute test script if exists (placeholder for future implementation)
        if (store.currentRequest.testScript) {
            try {
                console.log('Test script execution:', store.currentRequest.testScript);
                // TODO: Implement actual script execution via isolated VM
                // For now, just show that tests would run here
                store.testResults = `Test script would execute:\n${store.currentRequest.testScript}`;
            } catch (scriptError) {
                console.error('Test script error:', scriptError);
                store.testResults = `Test script error: ${scriptError.message}`;
            }
        } else {
            store.testResults = '';
        }
        
        store.activeResponseTab = 'body';
    } catch (err: any) {
        store.response = {
            status: 0,
            statusText: 'Error',
            data: err.message || 'Failed to make request',
            time: Date.now() - startTime,
            headers: {},
            error: err.message
        };
        store.testResults = '';
    } finally {
        store.isLoading = false;
    }
}

function addVariable() {
  if (!store.currentRequest.variables) store.currentRequest.variables = [];
  store.currentRequest.variables.push({ key: '', value: '', dataset: '', enabled: true });
}

function removeVariable(index: number) {
  const variable = filteredVariables.value[index];
  const realIndex = store.currentRequest.variables.indexOf(variable);
  if (realIndex > -1) {
    store.currentRequest.variables.splice(realIndex, 1);
  }
}

function saveRequest() {
  showSaveMenu.value = false;
  console.log('saveRequest called, currentRequest.id:', store.currentRequest.id);
  if (store.currentRequest.id) {
    console.log('Calling updateCurrentRequest');
    store.updateCurrentRequest();
  } else {
    console.log('Calling saveRequest (new)');
    store.saveRequest();
  }
}

function saveNewRequest() {
  showSaveMenu.value = false;
  store.saveRequest();
}
</script>