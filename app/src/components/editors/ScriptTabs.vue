<template>
  <div class="script-tabs flex flex-col h-full">
    <div class="flex border-b border-zinc-200 dark:border-zinc-700">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeSubTab = tab.id"
        class="px-4 py-2 border-b-2 transition-colors text-sm"
        :class="activeSubTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'"
        role="tab"
        :aria-selected="activeSubTab === tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="flex-1 overflow-auto pt-3" role="tabpanel">
      <ScriptEditor
        v-if="activeSubTab === 'pre-request'"
        :model-value="modelValue.preRequestScript || ''"
        placeholder="// Runs before request is sent"
        script-type="pre-request"
        @update:modelValue="modelValue.preRequestScript = $event"
      />

      <ScriptEditor
        v-if="activeSubTab === 'post-request'"
        :model-value="modelValue.postRequestScript || ''"
        placeholder="// Runs after response is received"
        script-type="post-request"
        @update:modelValue="modelValue.postRequestScript = $event"
      />

      <ScriptEditor
        v-if="activeSubTab === 'test'"
        :model-value="modelValue.testScript || ''"
        placeholder="// Test the response"
        script-type="test"
        @update:modelValue="modelValue.testScript = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ScriptEditor from './ScriptEditor.vue';

interface ScriptTabsModel {
  preRequestScript?: string;
  postRequestScript?: string;
  testScript?: string;
}

defineProps<{
  modelValue: ScriptTabsModel;
}>();

const activeSubTab = ref('pre-request');

const tabs = [
  { id: 'pre-request', name: 'Pre-request Script' },
  { id: 'post-request', name: 'Post-request Script' },
  { id: 'test', name: 'Test Script' }
];
</script>