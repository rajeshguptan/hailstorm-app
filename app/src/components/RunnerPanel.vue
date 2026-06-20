<template>
  <RunnerDetails
    v-bind="props"
    @update-run-config="emit('update-run-config', $event)"
  />
</template>

<script setup lang="ts">
import RunnerDetails from './RunnerDetails.vue';
import type { RunConfig } from '../types';

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: any[];
  body: { type: string; content: string };
  preRequestScript?: string;
  postRequestScript?: string;
  testScript?: string;
  flavors?: Request[];
  dependsOn?: string;
}

interface Collection {
  id: string;
  name: string;
  items: (Request | {
    id: string;
    name: string;
    items: (Request | any)[];
  })[];
  variables: any[];
}

const props = defineProps<{
  collections: Collection[];
  environments: any[];
  activeEnvironmentId: string | null;
  runConfigs: RunConfig[];
  selectedConfigId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update-run-config', config: RunConfig): void;
}>();
</script>
