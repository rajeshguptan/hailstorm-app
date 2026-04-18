<template>
  <div v-if="store.showRenameModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="store.showRenameModal = false">
    <div class="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-4" style="width: 350px;" @click.stop>
      <h5 class="mb-3">Rename</h5>
      <input v-model="newName" type="text" class="form-input bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded mb-3 w-full px-3 py-2" placeholder="Enter new name" @keydown.enter="handleRename" />
      <div class="flex gap-2 justify-end">
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="store.showRenameModal = false">Cancel</button>
        <button class="btn btn-sm bg-blue-500 text-white hover:bg-blue-600" @click="handleRename">Rename</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();
const newName = ref('');

watch(() => store.showRenameModal, (show) => {
  if (show) {
    newName.value = store.renameTarget?.currentName || '';
  }
});

function handleRename() {
  if (newName.value.trim() && store.renameTarget) {
    store.renameItem(store.renameTarget.id, newName.value.trim());
    store.showRenameModal = false;
  }
}
</script>