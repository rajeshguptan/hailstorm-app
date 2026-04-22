<template>
  <RunConfigsPanel
    :runConfigs="store.runConfigs"
    :selectedConfigId="store.selectedConfigId"
    @add-run-config="store.addRunConfig"
    @select-config="store.selectRunConfig"
    @context-menu="store.showContextMenu"
  />
</template>

<script setup lang="ts">
import RunConfigsPanel from '../components/RunConfigsPanel.vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();
</script>