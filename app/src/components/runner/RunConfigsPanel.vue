<template>
  <div class="run-configs-panel items-start">
    <div v-if="runConfigs.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No run configurations yet
    </div>
    <div v-else>
      <div v-for="config in runConfigs" :key="config.id" class="group run-config-item relative p-2 rounded mb-2 cursor-pointer transition-colors duration-200 border" :class="config.id === selectedConfigId ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'" @click="selectConfig(config.id)" @contextmenu.prevent="showContextMenu($event, config)" :data-testid="`run-config-item-${config.id}`" :data-run-config-name="config.name">
        <div class="flex justify-between items-center">
          <span class="truncate flex-1">{{ config.name }}</span>
          <button class="run-config-menu-btn ml-2 rounded px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700" title="More options" aria-label="More options" data-testid="run-config-more-btn" @click.stop="showContextMenu($event, config)" @contextmenu.prevent="showContextMenu($event, config)">•••</button>
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
  duration: number;
}

const emit = defineEmits<{
  (e: 'add-run-config'): void;
  (e: 'select-config', id: string): void;
  (e: 'context-menu', event: MouseEvent, type: string, id: string): void;
}>();

function selectConfig(id: string) {
  emit('select-config', id);
}

function showContextMenu(event: MouseEvent, config: RunConfig) {
  emit('context-menu', event, 'run-config', config.id);
}

defineProps<{
  runConfigs: RunConfig[];
  selectedConfigId: string | null;
}>();
</script>
