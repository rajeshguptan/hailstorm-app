<template>
  <div class="runner-view h-full flex">
    <!-- Configs List -->
    <div class="w-80 border-r border-zinc-200 dark:border-zinc-700 flex-shrink-0">
      <RunConfigsPanel
        :runConfigs="runnerStore.runConfigs"
        :selectedConfigId="runnerStore.selectedConfigId"
        @add-run-config="runnerStore.addRunConfig"
        @select-config="runnerStore.selectRunConfig"
        @context-menu="uiStore.showContextMenu"
      />
    </div>

    <!-- Config Details -->
    <div class="flex-1" v-if="runnerStore.selectedConfigId">
      <RunnerDetails
        :collections="collectionsStore.collections"
        :environments="environmentsStore.environments"
        :activeEnvironmentId="environmentsStore.activeEnvironmentId"
        :runConfigs="runnerStore.runConfigs"
        :selectedConfigId="runnerStore.selectedConfigId"
        @update-run-config="runnerStore.updateRunConfig"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
      <div class="text-center">
        <p class="mb-2">Select a run configuration to view details</p>
        <p class="text-sm">or create a new one</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RunConfigsPanel from '../components/RunConfigsPanel.vue';
import RunnerDetails from '../components/RunnerDetails.vue';
import { useRunnerStore } from '../stores/runner';
import { useUIStore } from '../stores/ui';
import { useCollectionsStore } from '../stores/collections';
import { useEnvironmentsStore } from '../stores/environments';

const runnerStore = useRunnerStore();
const uiStore = useUIStore();
const collectionsStore = useCollectionsStore();
const environmentsStore = useEnvironmentsStore();
</script>