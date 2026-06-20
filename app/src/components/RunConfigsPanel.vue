<template>
  <div class="run-configs-panel items-start">
    <div v-if="runConfigs.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No run configurations yet
    </div>
    <div v-else>
      <div v-for="config in runConfigs" :key="config.id" class="run-config-item p-2 rounded mb-2 cursor-pointer transition-colors duration-200 border" :class="config.id === selectedConfigId ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'" @click="$emit('select-config', config.id)" @contextmenu.prevent="$emit('context-menu', $event, 'run-config', config.id)">
        <div class="flex justify-between items-center">
          <span>{{ config.name }}</span>
        </div>
        <div class="text-sm" :class="config.id === selectedConfigId ? 'text-blue-700 dark:text-blue-200' : 'text-zinc-500 dark:text-zinc-400'">
          {{ config.collectionName }} - {{ config.selectedRequests.length }} requests
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const emit = defineEmits<{
  (e: 'add-run-config'): void;
  (e: 'select-config', id: string): void;
  (e: 'context-menu', event: MouseEvent, type: string, id: string): void;
}>();

defineProps<{
  runConfigs: RunConfig[];
  selectedConfigId: string | null;
}>();
</script>
