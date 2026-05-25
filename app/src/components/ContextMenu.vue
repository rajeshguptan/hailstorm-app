<template>
  <div v-if="uiStore.contextMenu.show" class="context-menu fixed bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-1" :style="{ left: uiStore.contextMenu.x + 'px', top: uiStore.contextMenu.y + 'px', zIndex: 1000 }">
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('rename')">Rename</div>
    <div v-if="uiStore.contextMenu.type === 'collection'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('run-collection')">Run</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('add-request')">Add Request</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('add-folder')">Add Folder</div>

    <div v-if="uiStore.contextMenu.type === 'flavor'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('run')">Run</div>
    <div v-if="uiStore.contextMenu.type === 'run-config'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('run')">Run</div>
    <div class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 text-red-500" @click="handleAction('delete')">Delete</div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores';
import { useUIStore } from '../stores/ui';
import { useCollectionsStore } from '../stores/collections';
import { useEnvironmentsStore } from '../stores/environments';
import { useRequestsStore } from '../stores/requests';
import { useRunnerStore } from '../stores/runner';
import { useUtilitiesStore } from '../stores/utilities';

const appStore = useAppStore();
const uiStore = useUIStore();
const collectionsStore = useCollectionsStore();
const environmentsStore = useEnvironmentsStore();
const requestsStore = useRequestsStore();
const runnerStore = useRunnerStore();
const utilitiesStore = useUtilitiesStore();

function handleAction(action: string) {
  const { type, id } = uiStore.contextMenu;

  switch (action) {
    case 'delete':
      if (type === 'collection') {
        collectionsStore.deleteCollection(id);
      } else if (type === 'environment') {
        environmentsStore.deleteEnvironment(id);
      } else if (type === 'request') {
        collectionsStore.deleteRequest(id);
      } else if (type === 'folder') {
        collectionsStore.deleteFolder(id);
      } else if (type === 'utility') {
        utilitiesStore.deleteUtility(id);
      } else if (type === 'run-config') {
        runnerStore.deleteRunConfig(id);
      }
      break;
    case 'run':
      if (type === 'run-config') {
        runnerStore.selectRunConfig(id);
      }
      break;
    case 'rename':
      console.log('[CONTEXT_MENU] Rename action triggered for type:', type, 'id:', id);
      const item = collectionsStore.findItemById(id);
      console.log('[CONTEXT_MENU] Found item:', item);
      if (item) {
        console.log('[CONTEXT_MENU] Setting rename target with currentName:', item.name);
        uiStore.renameTarget = { id, currentName: item.name };
        uiStore.showRenameModal = true;
        console.log('[CONTEXT_MENU] Rename modal should now be visible');
      } else {
        console.log('[CONTEXT_MENU] Item not found, cannot rename');
      }
      break;
    case 'add-flavor':
      break;
    case 'add-request':
      if (type === 'collection') {
        collectionsStore.addRequest(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addRequest(id, 'folder');
      }
      break;
    case 'add-folder':
      if (type === 'collection') {
        collectionsStore.addFolder(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addFolder(id, 'folder');
      }
      break;
  }

  uiStore.hideContextMenu();
}
</script>