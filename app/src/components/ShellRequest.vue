<template>
  <div class="shell-request flex flex-col h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
    <!-- Header: Name and Action Buttons -->
    <div class="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700">
      <input v-model="request.name" type="text" class="form-input bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 flex-1" placeholder="Request Name" />
      <button @click="saveRequest" class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm">Save</button>
      <button @click="runCommand" :disabled="isRunning" class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 text-sm">
        {{ isRunning ? 'Running...' : 'Run' }}
      </button>
    </div>

    <!-- Tab Navigation -->
    <div class="flex border-b border-zinc-200 dark:border-zinc-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 border-b-2 transition-colors text-sm"
        :class="activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-auto p-3">
      <div v-if="activeTab === 'script'" class="h-full">
        <textarea
          v-model="request.url"
          class="w-full h-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
          placeholder="Enter shell command (supports {{variable}} substitution)"
        ></textarea>
      </div>

      <div v-if="activeTab === 'pre-request'" class="h-full">
        <textarea
          v-model="request.preRequestScript"
          class="w-full h-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
          placeholder="// Pre-request script runs before shell command"
        ></textarea>
      </div>

      <div v-if="activeTab === 'post-request'" class="h-full">
        <textarea
          v-model="request.postRequestScript"
          class="w-full h-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-none"
          placeholder="// Parse shell output and set environment variables&#10;// Example: hs.setEnv('userId', hs.output.trim().split(/\s+/)[0])"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRequestsStore } from '../stores/requests';
import { useResponseStore } from '../stores/response';
import { useEnvironmentsStore } from '../stores/environments';

const requestsStore = useRequestsStore();
const responseStore = useResponseStore();
const environmentsStore = useEnvironmentsStore();

const activeTab = ref('script');
const isRunning = ref(false);

const tabs = [
  { id: 'script', name: 'Script' },
  { id: 'pre-request', name: 'Pre-request Script' },
  { id: 'post-request', name: 'Post-request Script' },
];

const request = computed({
  get: () => requestsStore.currentRequest,
  set: (val) => { requestsStore.currentRequest = val; }
});

async function saveRequest() {
  if (requestsStore.selectedRequestId) {
    requestsStore.updateCurrentRequest();
  }
}

async function runCommand() {
  if (isRunning.value) return;
  
  const cmd = requestsStore.currentRequest.url;
  if (!cmd) return;

  isRunning.value = true;

  // Reset response at start
  let combinedError = '';
  let consoleOutput = '';

  // Run pre-request script with console capture
  if (requestsStore.currentRequest.preRequestScript) {
    try {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
      };
      const scriptFn = new Function(requestsStore.currentRequest.preRequestScript);
      scriptFn();
      console.log = originalLog;
      consoleOutput = logs.join('\n');
    } catch (err: any) {
      combinedError = `[Pre-request] ${err.message || err}`;
      console.error(combinedError);
    }
  }

  // Execute shell command
  try {
    const result = await (window as any).api.runShell(cmd);
    combinedError = result.error ? (combinedError + '\n' + result.error).trim() : combinedError;

    responseStore.response = {
      status: result.error ? 1 : 0,
      statusText: result.error ? result.error : 'Success',
      data: result.output || '',
      time: 0,
      headers: {},
      error: combinedError || result.error || undefined,
      consoleOutput: consoleOutput || undefined,
    };

    // Run post-request script with ability to set environment variables and capture console output
    if (requestsStore.currentRequest.postRequestScript && responseStore.response?.data) {
      try {
        const originalLog = console.log;
        const postLogs: string[] = [];
        console.log = (...args: any[]) => {
          postLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
        };
        const hs = {
          output: responseStore.response.data,
          setEnv: (key: string, value: string) => {
            if (environmentsStore.activeEnvironmentId) {
              const env = environmentsStore.environments.find(e => e.id === environmentsStore.activeEnvironmentId);
              if (env) {
                const existing = env.variables.find(v => v.key === key);
                if (existing) existing.value = value;
                else env.variables.push({ key, value, enabled: true });
              }
            }
          }
        };
        const scriptFn = new Function('hs', requestsStore.currentRequest.postRequestScript);
        scriptFn(hs);
        console.log = originalLog;
        responseStore.response.consoleOutput = (consoleOutput + '\n' + postLogs.join('\n')).trim() || undefined;
      } catch (err: any) {
        const postError = `[Post-request] ${err.message || err}`;
        console.error(postError);
        // Append post-request error to response error field
        if (responseStore.response && postError) {
          responseStore.response.error = (responseStore.response.error || '') + '\n' + postError;
        }
      }
    }
  } catch (err: any) {
    responseStore.response = {
      status: 1,
      statusText: err.message,
      data: '',
      time: 0,
      headers: {},
      error: (combinedError || err.message),
      consoleOutput: consoleOutput || undefined,
    };
  } finally {
    isRunning.value = false;
  }
}
</script>