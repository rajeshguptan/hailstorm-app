<template>
  <div class="run-configs-panel items-start">
    <div class="flex gap-2 mb-2">
      <button class="btn btn-sm bg-blue-500 text-white w-full hover:bg-blue-600" @click="$emit('add-run-config')">+ New Config</button>
    </div>
    <div v-if="runConfigs.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No run configurations yet
    </div>
    <div v-else>
      <div v-for="config in runConfigs" :key="config.id" class="run-config-item p-2 rounded mb-2 cursor-pointer bg-zinc-200 dark:bg-zinc-800" :class="{ 'bg-blue-900 dark:bg-blue-900': config.id === selectedConfigId }" @click="$emit('select-config', config.id)" @contextmenu.prevent="$emit('context-menu', $event, 'run-config', config.id)">
        <div class="flex justify-between items-center">
          <span class="text-zinc-900 dark:text-white">{{ config.name }}</span>
        </div>
        <div class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
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

defineProps<{
  runConfigs: RunConfig[];
  selectedConfigId: string | null;
}>();

defineEmits<{
  (e: 'add-run-config'): void;
  (e: 'select-config', id: string): void;
  (e: 'context-menu', event: MouseEvent, type: string, id: string): void;
}>();
</script>
