<template>
  <RunConfigsPanel
    :runConfigs="runnerStore.runConfigs"
    :selectedConfigId="runnerStore.selectedConfigId"
    @add-run-config="runnerStore.addRunConfig"
    @select-config="runnerStore.selectRunConfig"
    @context-menu="uiStore.showContextMenu"
  />
</template>

<script setup lang="ts">
import RunConfigsPanel from '../components/RunConfigsPanel.vue';
import { useRunnerStore } from '../stores/runner';
import { useUIStore } from '../stores/ui';

const runnerStore = useRunnerStore();
const uiStore = useUIStore();
</script>