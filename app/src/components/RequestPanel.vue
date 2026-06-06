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
       <select v-if="requestsStore.currentRequest.body?.type !== 'graphql'" v-model="method" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1" style="width: 100px;">
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

            <button class="px-4 py-2 text-zinc-700 dark:text-white" :class="{ 'border-b-2 border-blue-500': requestsStore.activeRequestTab === 'description' }" @click="requestsStore.activeRequestTab = 'description'">Description</button>
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
             <option value="ntlm">NTLM Auth</option>
             <option value="clientcertificate">Client Certificate</option>
             <option value="oauth2">OAuth 2.0</option>
             <option value="apikey">API Key</option>
             <option value="inherit">Inherit from Parent</option>
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

        <div v-if="requestsStore.currentRequest.auth.type === 'ntlm'" class="mb-4">
          <div class="grid grid-cols-1 gap-2">
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Domain (optional)</label>
              <input v-model="requestsStore.currentRequest.auth.ntlm.domain" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Domain" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Username</label>
              <input v-model="requestsStore.currentRequest.auth.ntlm.username" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Username" />
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Password</label>
              <input v-model="requestsStore.currentRequest.auth.ntlm.password" type="password" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="Password" />
            </div>
          </div>
        </div>

        <div v-if="requestsStore.currentRequest.auth.type === 'clientcertificate'" class="mb-4">
          <div class="mb-2">
            <label class="block text-sm text-zinc-500 mb-1">Certificate Format</label>
            <select v-model="clientCertFormat" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
              <option value="pfx">PKCS#12 (.pfx/.p12)</option>
              <option value="pem">PEM (cert + key)</option>
            </select>
          </div>
          <div v-if="clientCertFormat === 'pfx'" class="mb-2">
            <label class="block text-sm text-zinc-500 mb-1">PFX File Path</label>
            <div class="flex gap-2">
              <input v-model="requestsStore.currentRequest.auth.clientCertificate.filePath" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="/path/to/cert.pfx" />
              <button class="px-2 py-1 border border-zinc-500 dark:border-zinc-600 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm" @click="selectPfxFile">Browse</button>
            </div>
            <label class="block text-sm text-zinc-500 mb-1 mt-2">Passphrase (optional)</label>
            <input v-model="requestsStore.currentRequest.auth.clientCertificate.passphrase" type="password" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full" placeholder="PFX passphrase" />
          </div>
          <div v-if="clientCertFormat === 'pem'" class="mb-2">
            <div class="mb-2">
              <label class="block text-sm text-zinc-500 mb-1">Certificate File Path</label>
              <div class="flex gap-2">
                <input v-model="requestsStore.currentRequest.auth.clientCertificate.certPath" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="/path/to/cert.pem" />
                <button class="px-2 py-1 border border-zinc-500 dark:border-zinc-600 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm" @click="selectPemCertFile">Browse</button>
              </div>
            </div>
            <div>
              <label class="block text-sm text-zinc-500 mb-1">Private Key File Path</label>
              <div class="flex gap-2">
                <input v-model="requestsStore.currentRequest.auth.clientCertificate.keyPath" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="/path/to/key.pem" />
                <button class="px-2 py-1 border border-zinc-500 dark:border-zinc-600 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm" @click="selectPemKeyFile">Browse</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="requestsStore.currentRequest.auth.type === 'oauth2'" class="mb-4">
          <OAuthConfig :auth="requestsStore.currentRequest.auth" />
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
          <input v-model="header.key" type="text" list="common-headers" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Key" @change="onHeaderKeyChange(header)" />
          <input v-model="header.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1" placeholder="Value" />
          <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="requestsStore.removeHeader(index)">×</button>
        </div>
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="requestsStore.addHeader()">+ Add Header</button>
      </div>
      <datalist id="common-headers">
        <option v-for="h in uniqueCommonHeaders" :key="h" :value="h">
          {{ h }}
        </option>
      </datalist>

<div v-if="requestsStore.activeRequestTab === 'body'">
         <div class="mb-2">
           <select v-model="requestsStore.currentRequest.body.type" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 w-full">
             <option value="none">None</option>
             <option value="form-data">Form Data</option>
             <option value="x-www-form-urlencoded">URL Encoded</option>
             <option value="raw">Raw</option>
             <option value="binary">Binary</option>
             <option value="graphql">GraphQL</option>
           </select>
         </div>
         <div v-if="requestsStore.currentRequest.body.type === 'graphql'" class="graphql-editor mt-2">
           <div class="mb-2">
             <label class="block text-sm text-zinc-500 mb-1">Query</label>
             <textarea v-model="graphqlQuery" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded w-full font-mono" rows="5" placeholder='query { users { id name } }'></textarea>
           </div>
           <div class="mb-2">
             <label class="block text-sm text-zinc-500 mb-1">Variables (JSON)</label>
             <textarea v-model="graphqlVariables" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded w-full font-mono" rows="3" placeholder='{"id": 1}'></textarea>
           </div>
           <div v-if="graphqlError" class="text-red-500 text-sm mb-2">{{ graphqlError }}</div>
         </div>
         <div v-else-if="requestsStore.currentRequest.body.type !== 'none'" class="mt-2">
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

<div v-if="requestsStore.activeRequestTab === 'scripts'" class="p-2">
         <div class="mb-2">
           <label class="block text-sm text-zinc-500 mb-1">Pre-request Script</label>
           <textarea v-model="requestsStore.currentRequest.preRequestScript" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded font-mono w-full" rows="3" placeholder="// Runs before request is sent"></textarea>
         </div>
         <div>
           <label class="block text-sm text-zinc-500 mb-1">Test Script</label>
           <textarea v-model="requestsStore.currentRequest.testScript" class="form-textarea bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded font-mono w-full" rows="3" placeholder="// Runs after response is received"></textarea>
         </div>
       </div>

       <div v-if="requestsStore.activeRequestTab === 'description'" class="p-2">
         <MarkdownDescription v-model="requestsStore.currentRequest.description" />
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
import OAuthConfig from './OAuthConfig.vue';
import MarkdownDescription from './MarkdownDescription.vue';
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
const clientCertFormat = ref<string>('pfx');
const graphqlQuery = ref<string>('');
const graphqlVariables = ref<string>('{}');
const graphqlError = ref<string>('');

watch(() => requestsStore.currentRequest.body.type, (newType) => {
  if (newType === 'graphql') {
    try {
      const currentBody = requestsStore.currentRequest.body.content;
      if (currentBody) {
        const parsed = JSON.parse(currentBody);
        graphqlQuery.value = parsed.query || '';
        graphqlVariables.value = JSON.stringify(parsed.variables || {}, null, 2);
      }
    } catch {
      // Invalid JSON, keep current values
    }
  }
});

const graphqlBody = computed({
  get: () => {
    try {
      const variables = JSON.parse(graphqlVariables.value);
      return JSON.stringify({ query: graphqlQuery.value, variables }, null, 2);
    } catch {
      return requestsStore.currentRequest.body.content;
    }
  },
  set: (val: string) => {
    requestsStore.currentRequest.body.content = val;
  }
});

watch(graphqlBody, (newVal) => {
  requestsStore.currentRequest.body.content = newVal;
});

watch(() => requestsStore.currentRequest.auth.type, (newType) => {
  if (newType === 'clientcertificate' && requestsStore.currentRequest.auth.clientCertificate) {
    clientCertFormat.value = requestsStore.currentRequest.auth.clientCertificate.type || 'pfx';
  }
  if (newType === 'oauth2' && !requestsStore.currentRequest.auth.oauth2) {
    requestsStore.currentRequest.auth.oauth2 = { grantType: 'client_credentials' };
  }
});

watch(clientCertFormat, (newFormat) => {
  if (requestsStore.currentRequest.auth.type === 'clientcertificate') {
    if (!requestsStore.currentRequest.auth.clientCertificate) {
      requestsStore.currentRequest.auth.clientCertificate = {};
    }
    requestsStore.currentRequest.auth.clientCertificate.type = newFormat as 'pkcs12' | 'pem';
  }
});

function toggleSaveMenu() {
  showSaveMenu.value = !showSaveMenu.value;
}

async function copyToClipboard() {
  try {
    const markdown = generateMarkdown();
    await navigator.clipboard.writeText(markdown);
    console.log('Copied to clipboard');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
}

function generateMarkdown(): string {
  const req = requestsStore.currentRequest;
  let markdown = `# ${req.method} ${req.url}\n\n`;

  if (requestsStore.urlParams && requestsStore.urlParams.length > 0) {
    markdown += `## URL Parameters\n\n`;
    requestsStore.urlParams.forEach(param => {
      if (param.enabled) {
        markdown += `- **${param.key}**: ${param.value}\n`;
      }
    });
    markdown += `\n`;
  }

  if (req.headers && req.headers.length > 0) {
    markdown += `## Headers\n\n`;
    req.headers.forEach(header => {
      if (header.enabled) {
        markdown += `- **${header.key}**: ${header.value}\n`;
      }
    });
    markdown += `\n`;
  }

  if (req.body && req.body.type !== 'none' && req.body.content) {
    markdown += `## Request Body\n\n`;
    if (req.body.type === 'json') {
      markdown += `\`\`\`json\n${req.body.content}\n\`\`\`\n\n`;
    } else {
      markdown += `\`\`\`\n${req.body.content}\n\`\`\`\n\n`;
    }
  }

  if (responseStore.response) {
    const res = responseStore.response;
    markdown += `## Response\n\n`;
    markdown += `**Status**: ${res.status} ${res.statusText}\n`;
    markdown += `**Time**: ${res.time}ms\n\n`;

    if (res.headers) {
      markdown += `### Response Headers\n\n`;
      Object.entries(res.headers).forEach(([key, value]) => {
        markdown += `- **${key}**: ${Array.isArray(value) ? value.join(', ') : value}\n`;
      });
      markdown += `\n`;
    }

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

const commonHeaders = [
  { key: 'Accept', value: 'application/json' },
  { key: 'Accept', value: 'application/xml' },
  { key: 'Accept', value: 'text/html' },
  { key: 'Accept-Encoding', value: 'gzip, deflate, br' },
  { key: 'Accept-Language', value: 'en-US,en;q=0.9' },
  { key: 'Authorization', value: 'Bearer ' },
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
  { key: 'Content-Type', value: 'multipart/form-data' },
  { key: 'Content-Type', value: 'text/plain' },
  { key: 'Cache-Control', value: 'no-cache' },
  { key: 'Cache-Control', value: 'max-age=0' },
  { key: 'Connection', value: 'keep-alive' },
  { key: 'Connection', value: 'close' },
  { key: 'Cookie', value: '' },
  { key: 'Host', value: '' },
  { key: 'Origin', value: '' },
  { key: 'Referer', value: '' },
  { key: 'User-Agent', value: 'Mozilla/5.0' },
  { key: 'X-Requested-With', value: 'XMLHttpRequest' },
  { key: 'X-CSRF-Token', value: '' },
  { key: 'X-API-Key', value: '' },
  { key: 'X-Auth-Token', value: '' },
  { key: 'If-None-Match', value: '' },
  { key: 'If-Match', value: '' },
];

const uniqueCommonHeaders = [...new Set(commonHeaders.map(h => h.key))];

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

const collectionRequests = computed(() => {
  const currentCollection = collectionsStore.selectedCollection;
  if (!currentCollection) return [];

  const allRequests: any[] = [];

  function collectRequests(items: any[]) {
    for (const item of items) {
      if (item.method && item.url) {
        if (item.id !== requestsStore.selectedRequestId) {
          allRequests.push(item);
        }
      } else if (item.items) {
        collectRequests(item.items);
      }
    }
  }

  collectRequests(currentCollection.items);
  return allRequests;
});

function hasCircularDependency(startRequestId: string, targetRequestId: string, visited = new Set<string>()): boolean {
  if (visited.has(startRequestId)) {
    return true;
  }

  visited.add(startRequestId);

  const request = collectionRequests.value.find((req: any) => req.id === startRequestId) ||
                  (requestsStore.selectedRequestId === startRequestId ? requestsStore.currentRequest : null);

  if (!request || !request.dependsOn) {
    return false;
  }

  if (request.dependsOn === targetRequestId) {
    return true;
  }

  return hasCircularDependency(request.dependsOn, targetRequestId, visited);
}

const validDependencyOptions = computed(() => {
  return collectionRequests.value.filter((req: any) => {
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

    for (const entry of result.historyEntries) {
      historyStore.addToHistory(entry);
    }

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

function onHeaderKeyChange(header: { key: string; value: string }) {
  const matched = commonHeaders.find(h => h.key === header.key && h.value);
  if (matched && !header.value) {
    header.value = matched.value;
  }
}

function selectPfxFile() {
  window.api.selectCertificateFileDialog('pfx').then(result => {
    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      requestsStore.currentRequest.auth.clientCertificate = {
        ...requestsStore.currentRequest.auth?.clientCertificate,
        filePath: result.filePaths[0],
      };
    }
  });
}

function selectPemCertFile() {
  window.api.selectCertificateFileDialog('pem').then(result => {
    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      requestsStore.currentRequest.auth.clientCertificate = {
        ...requestsStore.currentRequest.auth?.clientCertificate,
        certPath: result.filePaths[0],
      };
    }
  });
}

function selectPemKeyFile() {
  window.api.selectCertificateFileDialog('pem').then(result => {
    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      requestsStore.currentRequest.auth.clientCertificate = {
        ...requestsStore.currentRequest.auth?.clientCertificate,
        keyPath: result.filePaths[0],
      };
    }
  });
}
</script>