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
import { ref, computed, watch } from 'vue';
import { useCollectionsStore } from '../../stores/collections';
import { useRequestsStore } from '../../stores/requests';
import RequestTree from '../RequestTree.vue';
import type { Request, Folder } from '../../types';
import { logger } from '../../utils/logger';

logger.debug('[CollectionsPanel] Initializing stores...');
const collectionsStore = useCollectionsStore();
const requestsStore = useRequestsStore();
logger.debug('[CollectionsPanel] Stores initialized');

const collections = computed(() => {
  const cols = collectionsStore.collections;
  logger.debug('[CollectionsPanel] collections computed, length:', cols?.length);
  return Array.isArray(cols) ? cols : [];
});

const expandedCollections = ref<string[]>([]);
const expandedFolders = ref<string[]>([]);

// Watch for v-model changes to selectedRequestId and load request details
// This is needed because v-model only sets the ID, but we need to load the full request
watch(() => requestsStore.selectedRequestId, (newId) => {
  logger.debug('[CollectionsPanel] selectedRequestId watcher triggered:', newId);
  // Only load if the request isn't already the one we want
  if (newId && requestsStore.currentRequest.id !== newId) {
    requestsStore.selectRequest(newId);
  }
});

</script>
