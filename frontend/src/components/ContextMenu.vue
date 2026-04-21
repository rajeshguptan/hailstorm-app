<template>
  <div v-if="store.contextMenu.show" class="context-menu fixed bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-1" :style="{ left: store.contextMenu.x + 'px', top: store.contextMenu.y + 'px', zIndex: 1000 }">
    <div v-if="store.contextMenu.type === 'collection' || store.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('rename')">Rename</div>
    <div v-if="store.contextMenu.type === 'collection'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('run-collection')">Run</div>
    <div v-if="store.contextMenu.type === 'collection' || store.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('add-request')">Add Request</div>
    <div v-if="store.contextMenu.type === 'collection' || store.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('add-folder')">Add Folder</div>

    <div v-if="store.contextMenu.type === 'flavor'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('run')">Run</div>
    <div v-if="store.contextMenu.type === 'run-config'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="handleAction('run')">Run</div>
    <div class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 text-red-500" @click="handleAction('delete')">Delete</div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app';

const store = useAppStore();

function handleAction(action: string) {
  const { type, id } = store.contextMenu;
  
  switch (action) {
    case 'delete':
      if (type === 'collection') {
        store.deleteCollection(id);
      } else if (type === 'environment') {
        store.deleteEnvironment(id);
      } else if (type === 'request') {
        store.deleteRequest(id);
      } else if (type === 'folder') {
        store.deleteFolder(id);
      } else if (type === 'utility') {
        store.deleteUtility(id);
      }
      break;
    case 'rename':
      const item = store.findItemById(id);
      if (item) {
        store.renameTarget = { id, currentName: item.name };
        store.showRenameModal = true;
      }
      break;
    case 'add-flavor':
      break;
    case 'add-request':
      if (type === 'collection') {
        store.addRequest(id, 'collection');
      } else if (type === 'folder') {
        store.addRequest(id, 'folder');
      }
      break;
    case 'add-folder':
      if (type === 'collection') {
        store.addFolder(id, 'collection');
      } else if (type === 'folder') {
        store.addFolder(id, 'folder');
      }
      break;
  }
  
  store.hideContextMenu();
}
</script>