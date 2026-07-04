<template>
  <div v-if="uiStore.contextMenu.show" data-testid="context-menu" class="context-menu fixed bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-1" :style="{ left: uiStore.contextMenu.x + 'px', top: uiStore.contextMenu.y + 'px', zIndex: 1000 }" role="menu" aria-label="Context menu">
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('rename')" @keydown.enter="handleAction('rename')" @keydown.space="handleAction('rename')">Rename</div>
    <div v-if="uiStore.contextMenu.type === 'collection'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('duplicate')" @keydown.enter="handleAction('duplicate')" @keydown.space="handleAction('duplicate')">Duplicate</div>
    <div v-if="uiStore.contextMenu.type === 'request'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('rename')" @keydown.enter="handleAction('rename')" @keydown.space="handleAction('rename')">Rename</div>
    <div v-if="uiStore.contextMenu.type === 'request'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('duplicate')" @keydown.enter="handleAction('duplicate')" @keydown.space="handleAction('duplicate')">Duplicate</div>
    <div v-if="uiStore.contextMenu.type === 'request'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('copy')" @keydown.enter="handleAction('copy')" @keydown.space="handleAction('copy')">Copy</div>

    <div v-if="uiStore.copiedRequest && (uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder')" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('paste')" @keydown.enter="handleAction('paste')" @keydown.space="handleAction('paste')">Paste</div>

    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-http-request')" @keydown.enter="handleAction('add-http-request')" @keydown.space="handleAction('add-http-request')">Add HTTP Request</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-json-rpc-request')" @keydown.enter="handleAction('add-json-rpc-request')" @keydown.space="handleAction('add-json-rpc-request')">New JSON-RPC Request</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-graphql-request')" @keydown.enter="handleAction('add-graphql-request')" @keydown.space="handleAction('add-graphql-request')">Add GraphQL Request</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-folder')" @keydown.enter="handleAction('add-folder')" @keydown.space="handleAction('add-folder')">Add Folder</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-websocket-request')" @keydown.enter="handleAction('add-websocket-request')" @keydown.space="handleAction('add-websocket-request')">Add WebSocket Request</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-shell-command')" @keydown.enter="handleAction('add-shell-command')" @keydown.space="handleAction('add-shell-command')">Add Shell Command</div>
    <div v-if="uiStore.contextMenu.type === 'collection' || uiStore.contextMenu.type === 'folder'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('add-grpc-request')" @keydown.enter="handleAction('add-grpc-request')" @keydown.space="handleAction('add-grpc-request')">Add gRPC Request</div>

    <div v-if="uiStore.contextMenu.type === 'flavor'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" @click="handleAction('run')" @keydown.enter="handleAction('run')" @keydown.space="handleAction('run')">Run</div>
    <div v-if="uiStore.contextMenu.type === 'run-config'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" data-testid="context-menu-run" @click="handleAction('run')" @keydown.enter="handleAction('run')" @keydown.space="handleAction('run')">Run</div>
    <div v-if="uiStore.contextMenu.type === 'run-config'" class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" role="menuitem" tabindex="-1" data-testid="context-menu-duplicate" @click="handleAction('duplicate')" @keydown.enter="handleAction('duplicate')" @keydown.space="handleAction('duplicate')">Duplicate</div>
    <div class="p-2 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 text-red-500" role="menuitem" tabindex="-1" data-testid="context-menu-delete" @click="handleAction('delete')" @keydown.enter="handleAction('delete')" @keydown.space="handleAction('delete')">Delete</div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '../../stores/ui';
import { useCollectionsStore } from '../../stores/collections';
import { useRunnerStore } from '../../stores/runner';
import { useEnvironmentsStore } from '../../stores/environments';

const uiStore = useUIStore();
const collectionsStore = useCollectionsStore();
const runnerStore = useRunnerStore();
const environmentsStore = useEnvironmentsStore();

function handleAction(action: string) {
  const { type, id } = uiStore.contextMenu;

  switch (action) {
    case 'delete':
      if (type === 'collection') {
        collectionsStore.deleteCollection(id);
      } else if (type === 'request') {
        collectionsStore.deleteRequest(id);
      } else if (type === 'folder') {
        collectionsStore.deleteFolder(id);
      } else if (type === 'run-config') {
        runnerStore.deleteRunConfig(id);
      }
      break;
    case 'run':
      if (type === 'run-config') {
        const config = runnerStore.runConfigs.find(c => c.id === id);
        if (config) {
          void runnerStore.runLoadTest(config, collectionsStore.collections, environmentsStore.environments, environmentsStore.activeEnvironmentId).catch((error) => {
            console.error('Run failed:', error);
          });
        }
      }
      break;
    case 'rename':
      const item = collectionsStore.findItemById(id);
      if (item) {
        uiStore.renameTarget = { id, currentName: item.name };
        uiStore.showRenameModal = true;
      }
      break;
    case 'duplicate':
      if (type === 'collection') {
        collectionsStore.duplicateCollection(id);
      } else if (type === 'request') {
        collectionsStore.duplicateRequest(id);
      } else if (type === 'run-config') {
        const newName = prompt('Enter name for new run config:', `${runnerStore.runConfigs.find(c => c.id === id)?.name || 'Run Config'} Copy`);
        if (newName) {
          runnerStore.duplicateRunConfig(id, newName);
        }
      }
      break;
    case 'copy':
      if (type === 'request') {
        collectionsStore.copyRequest(id);
      }
      break;
    case 'paste':
      if (uiStore.copiedRequest && (type === 'collection' || type === 'folder')) {
        collectionsStore.pasteRequest(id, type as 'collection' | 'folder');
      }
      break;
    case 'add-http-request':
      if (type === 'collection') {
        collectionsStore.addHttpRequest(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addHttpRequest(id, 'folder');
      }
      break;
    case 'add-graphql-request':
      if (type === 'collection') {
        collectionsStore.addGraphqlRequest(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addGraphqlRequest(id, 'folder');
      }
      break;
    case 'add-json-rpc-request':
      if (type === 'collection') {
        collectionsStore.addJsonRpcRequest(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addJsonRpcRequest(id, 'folder');
      }
      break;
    case 'add-folder':
      if (type === 'collection') {
        collectionsStore.addFolder(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addFolder(id, 'folder');
      }
      break;
    case 'add-websocket-request':
      if (type === 'collection') {
        collectionsStore.addWebsocketRequest(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addWebsocketRequest(id, 'folder');
      }
      break;
    case 'add-shell-command':
      if (type === 'collection') {
        collectionsStore.addShellCommand(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addShellCommand(id, 'folder');
      }
      break;
    case 'add-grpc-request':
      if (type === 'collection') {
        collectionsStore.addGrpcRequest(id, 'collection');
      } else if (type === 'folder') {
        collectionsStore.addGrpcRequest(id, 'folder');
      }
      break;
  }

  uiStore.hideContextMenu();
}
</script>