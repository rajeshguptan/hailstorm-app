<template>
  <div class="collections-panel">
  <div v-if="collections.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
    No collections yet
  </div>
    <div v-else>
      <RequestTree 
        :collections="collections" 
        v-model:expanded-collections="expandedCollections"
        v-model:expanded-folders="expandedFolders"
        v-model:selected-request-id="requestsStore.selectedRequestId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCollectionsStore } from '../../stores/collections';
import { useRequestsStore } from '../../stores/requests';
import RequestTree from '../collection/RequestTree.vue';

const collectionsStore = useCollectionsStore();
const requestsStore = useRequestsStore();

const collections = computed(() => {
  const cols = collectionsStore.collections;
  return Array.isArray(cols) ? cols : [];
});

const expandedCollections = ref<string[]>([]);
const expandedFolders = ref<string[]>([]);

</script>
