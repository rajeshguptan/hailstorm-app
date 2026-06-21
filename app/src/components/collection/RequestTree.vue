<template>
  <div class="request-tree w-full">
    <div v-for="collection in collections" :key="collection.id" class="collection-node mb-2" :data-collection-id="collection.id" :data-testid="`collection-${collection.id}`">
      <div class="collection-header flex items-center p-2 rounded bg-zinc-200 dark:bg-zinc-800 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700" @click="toggleCollection(collection.id)" :data-collection-id="collection.id" @mouseenter="onCollectionMouseEnter(collection.id)" @mouseleave="onCollectionMouseLeave" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, collection.id, 'collection')">
        <span class="chevron mr-1 text-zinc-500">{{ expandedCollections.includes(collection.id) ? '▼' : '▶' }}</span>
        <span class="collection-name flex-1 text-zinc-900 dark:text-white font-medium">{{ collection.name }}</span>
        <span class="ellipsis-menu text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" @click.stop="showCollectionMenu(collection.id, $event)" :style="{ visibility: isCollectionHovered(collection.id) ? 'visible' : 'hidden' }">•••</span>
      </div>
      
<div v-if="expandedCollections.includes(collection.id)" class="collection-children ml-3 pl-2 border-l border-zinc-300 dark:border-zinc-600">
         <div v-if="collection.items.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-2 text-sm">
           Drop requests here
         </div>
         <TreeNode
           v-for="item in sortedCollectionItems(collection.items)"
           :key="item.id"
          :item="item"
          :level="0"
          :expanded-folders="expandedFolders"
          :selected-request-id="selectedRequestId"
          :collection-id="collection.id"
          :parent-container-id="collection.id"
          :parent-container-type="'collection'"
          @toggle-folder="toggleFolder"
          @select-request="selectRequest"
          @move-item="handleMoveItem"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collection, Request, Folder } from '../../types';
import TreeNode from './TreeNode.vue';
import { useUIStore } from '../../stores/ui';
import { useCollectionsStore } from '../../stores/collections';
import { useRequestsStore } from '../../stores/requests';

interface Props {
  collections: Collection[];
  expandedCollections: string[];
  expandedFolders: string[];
  selectedRequestId: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:expanded-collections', value: string[]): void;
  (e: 'update:expanded-folders', value: string[]): void;
  (e: 'update:selected-request-id', value: string | null): void;
}>();

const uiStore = useUIStore();
const collectionsStore = useCollectionsStore();
const requestsStore = useRequestsStore();

function isCollectionHovered(id: string) {
  return uiStore.hoveredTreeItemId === id;
}

function onCollectionMouseEnter(id: string) {
  uiStore.setHoveredTreeItem(id);
}

function onCollectionMouseLeave() {
  setTimeout(() => {
    if (uiStore.hoveredTreeItemId) {
      const stillHovered = document.querySelector(`[data-collection-id="${uiStore.hoveredTreeItemId}"]`);
      if (!stillHovered?.matches(':hover')) {
        uiStore.setHoveredTreeItem('');
      }
    }
  }, 0);
}

function toggleCollection(id: string) {
  // Clear request selection when selecting a collection
  requestsStore.selectRequest(null);
  // Select the collection when clicking
  collectionsStore.selectedCollectionId = id;
  // Also toggle expansion
  const expanded = [...props.expandedCollections];
  const index = expanded.indexOf(id);
  if (index > -1) {
    expanded.splice(index, 1);
  } else {
    expanded.push(id);
  }
  emit('update:expanded-collections', expanded);
}

function toggleFolder(id: string) {
  const expanded = [...props.expandedFolders];
  const index = expanded.indexOf(id);
  if (index > -1) {
    expanded.splice(index, 1);
  } else {
    expanded.push(id);
  }
  emit('update:expanded-folders', expanded);
}

function selectRequest(id: string | null) {
  requestsStore.selectRequest(id);
  emit('update:selected-request-id', id);
}

function showCollectionMenu(id: string, event?: MouseEvent) {
  uiStore.contextMenu.type = 'collection';
  uiStore.contextMenu.id = id;
  uiStore.contextMenu.show = true;
  uiStore.contextMenu.x = (event?.clientX ?? 0);
  uiStore.contextMenu.y = (event?.clientY ?? 0);
}

function handleMoveItem(payload: { itemId: string; sourceContainerId: string; sourceContainerType: string; targetContainerId: string; targetContainerType: string }) {
  collectionsStore.moveItem(payload.itemId, payload.targetContainerId, payload.targetContainerType as 'collection' | 'folder');
}

function onDragEnter(event: DragEvent) {
  event.preventDefault();
  const target = event.target as HTMLElement;
  const node = target.closest('.collection-node');
  if (node) node.classList.add('drag-over');
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();
  const target = event.target as HTMLElement;
  const node = target.closest('.collection-node');
  if (node) node.classList.remove('drag-over');
}

function onDrop(event: DragEvent, targetContainerId: string, targetContainerType: 'collection' | 'folder') {
  event.preventDefault();
  event.stopPropagation();
  const target = event.target as HTMLElement;
  target.closest('.collection-node')?.classList.remove('drag-over');
  
  try {
    const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
    const { itemId, containerId, containerType } = data;
    
    if (itemId === targetContainerId) return;
    
    collectionsStore.moveItem(itemId, targetContainerId, targetContainerType);
  } catch (error) {
    console.error('Error handling drop:', error);
  }
}

function sortedCollectionItems(items: (Request | Folder)[]) {
  return [...items].sort((a, b) => {
    const aIsFolder = 'items' in a && Array.isArray(a.items);
    const bIsFolder = 'items' in b && Array.isArray(b.items);
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return 0;
  });
}
</script>

<style scoped>
.method-get {
  @apply text-green-600 dark:text-green-400 font-bold;
}
.method-post {
  @apply text-purple-600 dark:text-purple-400 font-bold;
}
.method-put {
  @apply text-amber-600 dark:text-amber-300 font-bold;
}
.method-delete {
  @apply text-red-600 dark:text-red-500 font-bold;
}
.method-patch {
  @apply text-cyan-600 dark:text-cyan-400 font-bold;
}
.method-default {
  @apply text-zinc-600 dark:text-zinc-400 font-bold;
}

.chevron {
  transition: transform 0.15s ease;
}

.ellipsis-menu {
  padding: 2px 6px;
}

.collection-node.drag-over {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 2px dashed #3b82f6 !important;
}
</style>