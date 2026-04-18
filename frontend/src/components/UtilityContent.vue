<template>
  <div class="utility-content h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 overflow-auto p-4">
    <template v-if="store.selectedUtilityId === 'shell'">
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Command</label>
          <input
            v-model="shellCommand"
            @keyup.enter="runShell"
            placeholder="Enter shell command (e.g., ls, dir, echo hello)"
            class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
        </div>
        <div class="flex gap-2">
          <button @click="runShell" :disabled="isRunning" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50">
            {{ isRunning ? 'Running...' : 'Run' }}
          </button>
          <button @click="clearOutput" class="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded">
            Clear
          </button>
        </div>
      </div>
      <div v-if="shellOutput" class="mt-4">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Output</h4>
        <div class="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
          <pre class="text-sm font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{{ shellOutput }}</pre>
        </div>
      </div>
    </template>

    <template v-else-if="store.selectedUtilityId === 'az-token'">
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Azure Subscription (optional)</label>
          <input
            v-model="azSubscription"
            placeholder="Leave empty for default subscription"
            class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
        </div>
        <div>
          <label class="block text-xs text-zinc-500 mb-1">Resource (optional)</label>
          <input
            v-model="azResource"
            placeholder="e.g., https://management.azure.com"
            class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
        </div>
        <div class="flex items-center gap-2">
          <input v-model="azSubstituteVars" type="checkbox" id="azSubstituteVars" class="w-4 h-4">
          <label for="azSubstituteVars" class="text-sm text-zinc-700 dark:text-zinc-300">Substitute variables in command</label>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="azParseOutput" type="checkbox" id="azParseOutput" class="w-4 h-4" @change="toggleAzParseOutput">
          <label for="azParseOutput" class="text-sm text-zinc-700 dark:text-zinc-300">Parse output (extract token)</label>
        </div>
        <div v-if="azParseOutput" class="flex items-center gap-2">
          <input v-model="azAddToEnv" type="checkbox" id="azAddToEnv" class="w-4 h-4">
          <label for="azAddToEnv" class="text-sm text-zinc-700 dark:text-zinc-300">Add token to environment</label>
        </div>
        <div v-if="azAddToEnv" class="mt-2">
          <label class="block text-xs text-zinc-500 mb-1">Variable Name</label>
          <input
            v-model="azEnvVarName"
            placeholder="e.g., AZ_ACCESS_TOKEN"
            class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
        </div>
        <div class="flex gap-2">
          <button @click="runAzToken" :disabled="isRunning" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50">
            {{ isRunning ? 'Running...' : 'Get Token' }}
          </button>
          <button @click="clearOutput" class="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded">
            Clear
          </button>
        </div>
      </div>

      <div v-if="azOutput" class="mt-4">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Output</h4>
        <div class="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
          <pre class="text-sm font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{{ azOutput }}</pre>
        </div>
      </div>

      <div v-if="azParsedToken" class="mt-4">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Parsed Token</h4>
        <div class="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
          <pre class="text-sm font-mono text-green-600 dark:text-green-400 whitespace-pre-wrap">{{ azParsedToken }}</pre>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="text-center text-zinc-500 py-8">
        Select a utility from the sidebar to view its content
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();

const shellCommand = ref('');
const shellOutput = ref('');
const isRunning = ref(false);

const azSubscription = ref('');
const azResource = ref('');
const azSubstituteVars = ref(true);
const azParseOutput = ref(true);
const azAddToEnv = ref(false);
const azEnvVarName = ref('AZ_ACCESS_TOKEN');
const azOutput = ref('');
const azParsedToken = ref('');

function substituteVariables(text: string): string {
  if (!text) return text;
  const activeEnv = store.environments.find(e => e.id === store.activeEnvironmentId);
  if (!activeEnv) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const variable = activeEnv.variables.find(v => v.key === varName && v.enabled);
    return variable ? variable.value : match;
  });
}

async function runShell() {
  if (!shellCommand.value || isRunning.value) return;

  isRunning.value = true;
  shellOutput.value = '';

  let command = shellCommand.value;
  if (azSubstituteVars.value) {
    command = substituteVariables(command);
  }

  try {
    const result = await (window as any).api.runShell(command);
    shellOutput.value = result.output || result.error || 'No output';
  } catch (err: any) {
    shellOutput.value = `Error: ${err.message}`;
  } finally {
    isRunning.value = false;
  }
}

function toggleAzParseOutput() {
  if (azParseOutput.value) {
    azAddToEnv.value = true;
  }
}

async function runAzToken() {
  if (isRunning.value) return;

  isRunning.value = true;
  azOutput.value = '';
  azParsedToken.value = '';

  let command = 'az account get-access-token';
  if (azSubscription.value) {
    if (azSubstituteVars.value) {
      const sub = substituteVariables(azSubscription.value);
      command += ` --subscription "${sub}"`;
    } else {
      command += ` --subscription "${azSubscription.value}"`;
    }
  }
  if (azResource.value) {
    if (azSubstituteVars.value) {
      const res = substituteVariables(azResource.value);
      command += ` --resource "${res}"`;
    } else {
      command += ` --resource "${azResource.value}"`;
    }
  }
  command += ' --output json';

  try {
    const result = await (window as any).api.runShell(command);
    azOutput.value = result.output || result.error || 'No output';

    if (azParseOutput.value && result.output) {
      try {
        const parsed = JSON.parse(result.output.trim());
        azParsedToken.value = parsed.accessToken;

        if (azAddToEnv.value && azParsedToken.value) {
          addTokenToEnvironment(azParsedToken.value);
        }
      } catch {
        azParsedToken.value = 'Failed to parse output';
      }
    }
  } catch (err: any) {
    azOutput.value = `Error: ${err.message}`;
  } finally {
    isRunning.value = false;
  }
}

function addTokenToEnvironment(token: string) {
  if (!store.activeEnvironmentId || !azEnvVarName.value) return;

  const envIndex = store.environments.findIndex(e => e.id === store.activeEnvironmentId);
  if (envIndex === -1) return;

  const env = store.environments[envIndex];
  const existingVar = env.variables.find(v => v.key === azEnvVarName.value);

  if (existingVar) {
    existingVar.value = token;
  } else {
    env.variables.push({ key: azEnvVarName.value, value: token, enabled: true });
  }

  store.saveToLocalStorage();
}

function clearOutput() {
  shellCommand.value = '';
  shellOutput.value = '';
  azOutput.value = '';
  azParsedToken.value = '';
}
</script>