<template>
<div class="utilities-list">
  <div class="p-2 mb-2">
    <button @click="addUtility" class="w-full text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded">Add Utility</button>
  </div>
  <div v-for="utility in utilitiesStore.utilities" :key="utility.id" class="mb-1">
    <div
      class="flex items-center p-2 rounded cursor-pointer bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      :class="{ 'bg-zinc-300 dark:bg-zinc-600': utilitiesStore.selectedUtilityId === utility.id }"
      @click="utilitiesStore.selectUtility(utility.id)"
      @contextmenu.prevent="showContextMenu($event, utility)"
    >
      <span class="text-sm text-zinc-900 dark:text-white flex-1">{{ utility.name }}</span>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { useUtilitiesStore } from '../../stores/utilities';
import { useAppStore } from '../../stores';
import { useUIStore } from '../../stores/ui';
import type { Utility } from '../../types';

const utilitiesStore = useUtilitiesStore();
const appStore = useAppStore();
const uiStore = useUIStore();

function addUtility() {
    const utility: Utility = {
        id: appStore.generateId('utility'),
        name: 'New Utility',
        icon: '🔧',
        command: '',
        postProcessScript: ''
    };
    utilitiesStore.utilities.push(utility);
    appStore.saveToLocalStorage();
}

function showContextMenu(event: MouseEvent, utility: Utility) {
    uiStore.showContextMenu(event, 'utility', utility.id);
}
</script>