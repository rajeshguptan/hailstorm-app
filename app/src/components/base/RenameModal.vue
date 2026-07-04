<template>
  <div v-if="uiStore.showRenameModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="uiStore.showRenameModal = false" role="dialog" aria-modal="true" aria-labelledby="rename-modal-title">
    <div class="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-4" style="width: 350px;" @click.stop>
      <h5 id="rename-modal-title" class="mb-3">Rename</h5>
      <label for="rename-input" class="sr-only">New name</label>
      <input v-model="newName" type="text" id="rename-input" class="form-input bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded mb-3 w-full px-3 py-2" placeholder="Enter new name" @keydown.enter="handleRename" @keydown.escape="uiStore.showRenameModal = false" aria-label="Enter new name" />
      <div class="flex gap-2 justify-end">
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="uiStore.showRenameModal = false">Cancel</button>
        <button class="btn btn-sm bg-blue-500 text-white hover:bg-blue-600" @click="handleRename">Rename</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useUIStore } from '../../stores/ui';
import { useAppStore } from '../../stores';
import { logger } from '../../utils/logger';

const uiStore = useUIStore();
const appStore = useAppStore();
const newName = ref('');

onMounted(() => {
  if (uiStore.showRenameModal) {
    const input = document.getElementById('rename-input') as HTMLInputElement;
    input?.focus();
  }
});

watch(() => uiStore.showRenameModal, (show) => {
  logger.debug('[RENAME_MODAL] showRenameModal changed to:', show);
  logger.debug('[RENAME_MODAL] renameTarget:', uiStore.renameTarget);
  if (show) {
    newName.value = uiStore.renameTarget?.currentName || '';
    logger.debug('[RENAME_MODAL] Set newName to:', newName.value);
    setTimeout(() => {
      const input = document.getElementById('rename-input') as HTMLInputElement;
      input?.focus();
    }, 50);
  }
});

function handleRename() {
  logger.debug('[RENAME_MODAL] handleRename called with newName:', newName.value);
  logger.debug('[RENAME_MODAL] renameTarget:', uiStore.renameTarget);
  if (newName.value.trim() && uiStore.renameTarget) {
    logger.debug('[RENAME_MODAL] Calling appStore.renameItem with id:', uiStore.renameTarget.id, 'newName:', newName.value.trim());
    appStore.renameItem(uiStore.renameTarget.id, newName.value.trim());
    uiStore.showRenameModal = false;
    logger.debug('[RENAME_MODAL] Rename completed and modal closed');
  } else {
    logger.debug('[RENAME_MODAL] Cannot rename - missing data');
  }
}
</script>