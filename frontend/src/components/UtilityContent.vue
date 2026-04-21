<template>
  <div class="utility-content h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 overflow-auto p-4">
    <div class="space-y-4">
      <!-- Utility Name -->
      <div>
        <label class="block text-xs text-zinc-500 mb-1">Utility Name</label>
        <input
          v-model="currentUtilityName"
          class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
      </div>

      <!-- Tool Selection -->
      <div>
        <label class="block text-xs text-zinc-500 mb-1">Tool</label>
        <select
          v-model="selectedTool"
          class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="shell">Execute Shell</option>
        </select>
      </div>

      <!-- Command Input -->
      <div>
        <label class="block text-xs text-zinc-500 mb-1">Command</label>
        <textarea
          v-model="command"
          placeholder="Enter command with {{variable}} substitution"
          rows="3"
          class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-vertical"
        ></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <button @click="runCommand" :disabled="isRunning" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50">
          {{ isRunning ? 'Running...' : 'Run' }}
        </button>
        <button @click="saveUtility" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">
          Save
        </button>
        <button @click="clearOutput" class="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded">
          Clear
        </button>
      </div>

      <!-- Output -->
      <div v-if="output">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Output</h4>
        <div class="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
          <pre class="text-sm font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{{ output }}</pre>
        </div>
      </div>

      <!-- Post-Processing Script -->
      <div>
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Post-Processing Script</h4>
        <textarea
          v-model="postProcessScript"
          rows="8"
          class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-vertical font-mono text-sm"
          placeholder="Use hs.output for command output, hs.setEnv(key, value) to set environment variables. E.g.,&#10;let userId = hs.output.trim().split(/\s+/)[0];&#10;hs.setEnv('USER', userId);"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '../stores/app';
import MonacoEditor from './MonacoEditor.vue';

const store = useAppStore();

const command = computed({
  get: () => {
    const utility = store.utilities.find(u => u.id === selectedUtilityId.value);
    return utility?.command || '';
  },
  set: (value) => {
    const utility = store.utilities.find(u => u.id === selectedUtilityId.value);
    if (utility) {
      utility.command = value;
      store.updateUtility(utility);
    }
  }
});
const output = ref('');
const isRunning = ref(false);
const selectedTool = ref('shell');


const postProcessScript = computed({
  get: () => {
    const utility = store.utilities.find(u => u.id === selectedUtilityId.value);
    return utility?.postProcessScript || '';
  },
  set: (script) => {
    const utility = store.utilities.find(u => u.id === selectedUtilityId.value);
    if (utility) {
      utility.postProcessScript = script;
      store.updateUtility(utility);
    }
  }
});

const selectedUtilityId = computed({
  get: () => store.selectedUtilityId,
  set: (id) => store.selectUtility(id)
});

const currentUtilityName = computed({
  get: () => {
    const utility = store.utilities.find(u => u.id === selectedUtilityId.value);
    return utility?.name || '';
  },
  set: (name) => {
    const utility = store.utilities.find(u => u.id === selectedUtilityId.value);
    if (utility) {
      utility.name = name;
      store.updateUtility(utility);
    }
  }
});

function substituteVariables(text: string): string {
  if (!text) return text;
  const activeEnv = store.environments.find(e => e.id === store.activeEnvironmentId);
  if (!activeEnv) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const variable = activeEnv.variables.find(v => v.key === varName && v.enabled);
    return variable ? variable.value : match;
  });
}

async function runCommand() {
  if (!command.value || isRunning.value) return;

  isRunning.value = true;
  output.value = '';

  let cmd = substituteVariables(command.value);

  try {
    const result = await (window as any).api.runShell(cmd);
    const cmdOutput = result.output || result.error || 'No output';
    output.value = cmdOutput;

    // Apply post-processing script
    if (postProcessScript.value) {
      try {
        const hs = {
          output: cmdOutput,
          setEnv: setVariable
        };
        const scriptFn = new Function('hs', postProcessScript.value);
        scriptFn(hs);
      } catch (err) {
        console.error('Post-processing script error:', err);
      }
    }
  } catch (err: any) {
    output.value = `Error: ${err.message}`;
  } finally {
    isRunning.value = false;
  }
}

function setVariable(key: string, value: string) {
  if (!store.activeEnvironmentId) return;

  const envIndex = store.environments.findIndex(e => e.id === store.activeEnvironmentId);
  if (envIndex === -1) return;

  const env = store.environments[envIndex];
  const existingVar = env.variables.find(v => v.key === key);

  if (existingVar) {
    existingVar.value = value;
  } else {
    env.variables.push({ key, value, enabled: true });
  }

  store.saveToLocalStorage();
}

function saveUtility() {
  // Command is auto-saved via computed setter
  store.saveToLocalStorage();
  alert('Utility saved!');
}

function clearOutput() {
  output.value = '';
}





function editScript(rule: { variable: string; script: string }) {
  editingScript.value = rule.script;
  editingRuleIndex.value = postProcessRules.value.indexOf(rule);
  showScriptModal.value = true;
}

function saveScript() {
  if (editingRuleIndex.value >= 0) {
    const rules = [...postProcessRules.value];
    rules[editingRuleIndex.value].script = editingScript.value;
    postProcessRules.value = rules;
  }
  closeScriptModal();
}

function closeScriptModal() {
  showScriptModal.value = false;
  editingScript.value = '';
  editingRuleIndex.value = -1;
}
</script>