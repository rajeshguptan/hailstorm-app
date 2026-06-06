<template>
  <div class="tree-node" :data-id="item.id" :data-testid="`node-${item.id}`"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <div 
      class="flex items-center py-1 px-2 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 group relative"
      :class="isSelected ? 'bg-blue-100 dark:bg-blue-800' : ''"
      @click="handleItemClick"
      @contextmenu.prevent.stop="showContextMenu($event)"
      role="button"
      tabindex="0"
      draggable="true"
      @dragstart="onDragStart"
      @dragover.prevent
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <span 
        v-if="isFolder" 
        class="chevron mr-1 text-zinc-500 cursor-pointer"
        @click.stop="toggleFolder"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="w-4 mr-1"></span>
      
      <span v-if="isRequest" :class="getMethodClass(displayMethod)" class="method-badge mr-2 text-xs font-bold min-w-[60px]">
        {{ displayMethod }}
      </span>
      
      <span class="item-name text-zinc-900 dark:text-white text-sm flex-1">
        {{ item.name }}
      </span>
      
      <span class="ellipsis-menu text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer" 
            @click.stop="showContextMenu($event)" title="More options"
            :style="{ visibility: isHovered ? 'visible' : 'hidden' }">•••</span>
    </div>
    
    <div v-if="isFolder && isExpanded" class="folder-children ml-3 pl-2 border-l border-zinc-300 dark:border-zinc-600">
<div v-if="item.items.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-2 text-sm">
         Drop requests here
       </div>
       <TreeNode
         v-for="child in sortedItems(item.items)"
         :key="child.id"
        :item="child"
        :level="level + 1"
        :expanded-folders="expandedFolders"
        :selected-request-id="selectedRequestId"
        :collection-id="collectionId"
        :parent-container-id="item.id"
        :parent-container-type="'folder'"
        @toggle-folder="emit('toggle-folder', $event)"
        @select-request="selectRequest"
        @move-item="emit('move-item', $event)"
      />
      <div v-if="item.items.length > 0" class="drop-zone-between h-1 w-full border-dashed border border-zinc-300 dark:border-zinc-600 my-1" @dragover.prevent="onDragEnter" @dragleave="onDragLeave" @drop="onFolderDrop"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Request, Folder } from '../types';
import { computed } from 'vue';
import { useUIStore } from '../stores/ui';

interface Props {
  item: Request | Folder;
  level: number;
  expandedFolders: string[];
  selectedRequestId: string | null;
  collectionId: string;
  parentContainerId?: string;
  parentContainerType?: 'collection' | 'folder';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'toggle-folder', id: string): void;
  (e: 'select-request', id: string | null): void;
  (e: 'move-item', payload: { itemId: string; sourceContainerId: string; sourceContainerType: string; targetContainerId: string; targetContainerType: string }): void;
}>();

const uiStore = useUIStore();
const isFolder = 'items' in props.item && Array.isArray(props.item.items) && !('variables' in props.item);
const isRequest = 'method' in props.item;
const isExpanded = computed(() => props.expandedFolders.includes(props.item.id));
const isSelected = computed(() => props.item.id === props.selectedRequestId);
const isHovered = computed(() => uiStore.hoveredTreeItemId === props.item.id);
const displayMethod = computed(() => {
  if (isRequest && props.item.body?.type === 'graphql') return 'GQL';
  return props.item.method;
});

function onMouseEnter() {
  uiStore.setHoveredTreeItem(props.item.id);
}

function onMouseLeave() {
  setTimeout(() => {
    if (uiStore.hoveredTreeItemId === props.item.id) {
      uiStore.setHoveredTreeItem('');
    }
  }, 0);
}

function toggleFolder() {
  emit('toggle-folder', props.item.id);
}

function handleItemClick() {
  if (isFolder) {
    toggleFolder();
  } else {
    emit('select-request', props.item.id);
  }
}

function selectRequest(id: string | null) {
  emit('select-request', id);
}

function onDragStart(event: DragEvent) {
  event.dataTransfer!.effectAllowed = 'move';
  const containerType = isFolder ? 'folder' : 'request';
  const containerId = props.parentContainerId || props.collectionId;
  event.dataTransfer!.setData('text/plain', JSON.stringify({
    itemId: props.item.id,
    containerId: containerId,
    containerType: containerType
  }));
}

function onDragEnter(event: DragEvent) {
  event.preventDefault();
  const target = event.target as HTMLElement;
  const node = target.closest('.tree-node');
  if (node) node.classList.add('drag-over');
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();
  const target = event.target as HTMLElement;
  const node = target.closest('.tree-node');
  if (node) node.classList.remove('drag-over');
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.target as HTMLElement;
  target.closest('.tree-node')?.classList.remove('drag-over');

  try {
    const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
    const { itemId, containerId, containerType } = data;
    const targetContainerType = props.parentContainerType || 'collection';
    const targetContainerId = props.parentContainerId || props.collectionId;

    if (itemId !== targetContainerId) {
      emit('move-item', {
        itemId,
        sourceContainerId: containerId,
        sourceContainerType: containerType,
        targetContainerId,
        targetContainerType
      });
    }
  } catch (error) {
    console.error('Error handling drop:', error);
  }
}

function onFolderDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.target as HTMLElement;
  target.classList.remove('drag-over');

  try {
    const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
    const { itemId, containerId, containerType } = data;

    if (itemId !== props.item.id) {
      emit('move-item', {
        itemId,
        sourceContainerId: containerId,
        sourceContainerType: containerType,
        targetContainerId: props.item.id,
        targetContainerType: 'folder'
      });
    }
  } catch (error) {
    console.error('Error handling folder drop:', error);
  }
}

function getItemType(): string {
  return isRequest ? 'request' : 'folder';
}

function showContextMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  uiStore.contextMenu.type = getItemType();
  uiStore.contextMenu.id = props.item.id;
  uiStore.contextMenu.show = true;
  uiStore.contextMenu.x = event.clientX;
  uiStore.contextMenu.y = event.clientY;
}

function getMethodClass(method: string): string {
  const m = method.toLowerCase();
  if (m === 'get') return 'method-get';
  if (m === 'post') return 'method-post';
  if (m === 'put') return 'method-put';
  if (m === 'delete') return 'method-delete';
  if (m === 'patch') return 'method-patch';
  if (m === 'gql') return 'method-gql';
  return 'method-default';
}

function sortedItems(items: (Request | Folder)[]) {
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

.method-gql {
  @apply text-pink-600 dark:text-pink-400 font-bold;
}

.tree-node.drag-over {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 2px dashed #3b82f6 !important;
  border-radius: 4px;
}

.ellipsis-menu {
  padding: 2px 6px;
}
</style>