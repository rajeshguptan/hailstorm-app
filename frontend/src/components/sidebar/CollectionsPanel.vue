<template>
  <div class="collections-panel">
    <div class="flex gap-2 mb-2">
      <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 flex-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click="handleImport">Import</button>
      <button class="btn btn-sm bg-blue-500 text-white flex-1 hover:bg-blue-600" @click="store.addCollection()">+ Collection</button>
    </div>
    <div v-if="collections.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No collections yet
    </div>
    <div v-else>
      <div v-for="coll in collections" :key="coll.id" class="collection-item mb-2">
        <div class="flex items-center p-2 rounded bg-zinc-200 dark:bg-zinc-800 cursor-pointer" @click="toggleCollection(coll.id)" @contextmenu.prevent="store.showContextMenu($event, 'collection', coll.id)">
          <span class="mr-2">{{ expandedCollections.includes(coll.id) ? '📂' : '📁' }}</span>
          <span class="flex-1 text-zinc-900 dark:text-white">{{ coll.name }}</span>
        </div>
        <div v-if="expandedCollections.includes(coll.id)" class="ml-3 mt-1">
          <template v-for="item in coll.items" :key="item.id">
            <div class="request-item p-1 rounded cursor-pointer mb-1 flex items-center" :class="item.id === store.selectedRequestId ? 'bg-blue-200 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'" :style="{ paddingLeft: '8px' }" @click="handleItemClick($event, item)" @contextmenu.prevent="store.showContextMenu($event, getItemType(item), item.id)" role="button" tabindex="0" @keydown.enter="handleItemClick($event, item)">
              <span v-if="hasMethod(item) && (item as Request).flavors?.length" class="mr-1 cursor-pointer text-blue-400" @click.stop="toggleFlavors(item.id)">{{ (item as Request).flavors?.length ? (expandedFlavors.includes(item.id) ? '▼' : '▶') : '+' }}</span>
              <span v-if="hasMethod(item)" class="badge mr-1" :class="getMethodClass(item)">{{ getMethod(item) }}</span>
              <span v-if="hasItems(item)" class="mr-1">{{ expandedFolders.includes(item.id) ? '📂' : '📁' }}</span>
              <span v-if="hasItems(item)" class="text-zinc-900 dark:text-white">{{ item.name }}</span>
              <span v-else class="text-sm text-zinc-700 dark:text-zinc-300">{{ item.name }}</span>
            </div>
            <template v-if="hasItems(item) && expandedFolders.includes(item.id)">
              <div v-for="subItem in (item as Folder).items" :key="subItem.id" class="ml-3 request-item p-1 rounded cursor-pointer mb-1 flex items-center" :class="subItem.id === store.selectedRequestId ? 'bg-blue-200 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'" :style="{ paddingLeft: '8px' }" @click="handleItemClick($event, subItem)" @contextmenu.prevent="store.showContextMenu($event, getItemType(subItem), subItem.id)" role="button" tabindex="0" @keydown.enter="handleItemClick($event, subItem)">
                <span v-if="hasMethod(subItem) && (subItem as Request).flavors?.length" class="mr-1 cursor-pointer text-blue-400" @click.stop="toggleFlavors(subItem.id)">{{ (subItem as Request).flavors?.length ? (expandedFlavors.includes(subItem.id) ? '▼' : '▶') : '+' }}</span>
                <span v-if="hasMethod(subItem)" class="badge mr-1" :class="getMethodClass(subItem)">{{ getMethod(subItem) }}</span>
                <span v-if="hasItems(subItem)" class="mr-1">{{ expandedFolders.includes(subItem.id) ? '📂' : '📁' }}</span>
                <span v-if="hasItems(subItem)" class="text-zinc-900 dark:text-white">{{ subItem.name }}</span>
                <span v-else class="text-sm text-zinc-700 dark:text-zinc-300">{{ subItem.name }}</span>
              </div>
            </template>
            <div v-if="hasMethod(item) && expandedFlavors.includes(item.id) && (item as Request).flavors?.length" class="ml-6">
              <div v-for="flavor in (item as Request).flavors" :key="flavor.id" class="request-item p-1 rounded cursor-pointer mb-1" :class="flavor.id === store.selectedRequestId ? 'bg-blue-200 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'" :style="{ paddingLeft: '8px' }" @click.stop="store.openRequest(flavor)" @contextmenu.prevent="store.showContextMenu($event, 'flavor', flavor.id)">
                <span class="badge mr-1" :class="getMethodClass(flavor)">{{ flavor.method }}</span>
                <span class="text-sm text-blue-400">{{ flavor.name }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/app';
import type { Request, Folder } from '../../types';

const store = useAppStore();
const collections = computed(() => store.collections);

const expandedCollections = ref<string[]>([]);
const expandedFolders = ref<string[]>([]);
const expandedFlavors = ref<string[]>([]);

async function handleImport() {
  try {
    if (!window.api) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          importData(data);
        } catch (err) {
          console.error('Failed to import:', err);
        }
      };
      input.click();
      return;
    }
    const content = await window.api.importCollection();
    if (!content) {
      console.log('No content returned from file dialog');
      return;
    }
    const data = JSON.parse(content);
    importData(data);
  } catch (err) {
    console.error('Import error:', err);
  }
}

function importData(data: any) {
  if (!data) return;
  const processItems = (items: any[]): any[] => {
    return items.map((item: any) => {
      const newItem = { ...item };
      if (!newItem.id) {
        newItem.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      if (newItem.item && Array.isArray(newItem.item)) {
        newItem.items = processItems(newItem.item);
        delete newItem.item;
      }
      return newItem;
    });
  };
  const processCollection = (c: any) => ({
    ...c,
    items: processItems(c.items || [])
  });
  if (data.collection) {
    store.collections.push(processCollection(data.collection));
    store.saveToLocalStorage();
  } else if (data.collections) {
    store.collections.push(...data.collections.map(processCollection));
    store.saveToLocalStorage();
  } else if (Array.isArray(data)) {
    store.collections.push(...data.map(processCollection));
    store.saveToLocalStorage();
  } else if (data.info && data.item) {
    store.collections.push({
      id: `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.info.name || 'Imported Collection',
      items: processItems(data.item),
      variables: []
    });
    store.saveToLocalStorage();
  } else {
    console.log('Unknown data format:', Object.keys(data));
  }
}

function toggleCollection(id: string) {
  const index = expandedCollections.value.indexOf(id);
  if (index > -1) {
    expandedCollections.value.splice(index, 1);
  } else {
    expandedCollections.value.push(id);
  }
}

function handleItemClick(event: MouseEvent, item: any) {
  event.preventDefault();
  event.stopPropagation();
  console.log('handleItemClick item:', item, 'keys:', Object.keys(item));
  if (hasItems(item)) {
    toggleFolder(item.id);
  } else {
    let requestItem = item;
    if ('request' in item) {
      console.log('Item has nested request, extracting');
      requestItem = item.request;
    }
    if (!requestItem.id) {
      requestItem.id = store.generateId('req');
    }
    store.selectRequest(requestItem.id);
  }
}

function toggleFolder(id: string) {
  const index = expandedFolders.value.indexOf(id);
  if (index > -1) {
    expandedFolders.value.splice(index, 1);
  } else {
    expandedFolders.value.push(id);
  }
}

function toggleFlavors(id: string) {
  const index = expandedFlavors.value.indexOf(id);
  if (index > -1) {
    expandedFlavors.value.splice(index, 1);
  } else {
    expandedFlavors.value.push(id);
  }
}

function hasMethod(item: any): boolean {
  if ('request' in item) {
    return 'method' in item.request;
  }
  return 'method' in item;
}

function hasItems(item: any): boolean {
  return 'items' in item;
}

function getMethod(item: any): string {
  if ('request' in item) {
    return item.request.method;
  }
  return item.method;
}

function getItemType(item: any): string {
  if ('request' in item) {
    return 'request';
  }
  return 'method' in item ? 'request' : 'folder';
}

function getMethodClass(item: any): string {
  const method = (('request' in item) ? item.request.method : item.method)?.toLowerCase() || 'get';
  return method === 'get' ? 'bg-green-500' : method === 'post' ? 'bg-blue-500' : method === 'put' ? 'bg-yellow-500 text-black' : method === 'delete' ? 'bg-red-500' : 'bg-cyan-500';
}
</script>