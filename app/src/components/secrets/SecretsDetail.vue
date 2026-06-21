<template>
  <div class="secret-detail-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div v-if="!secretsStore.isUnlocked" class="p-4 text-center">
      <div class="text-zinc-500 dark:text-zinc-400 mb-4">
        🔒 Secrets are locked. Please unlock using the encryption key.
      </div>
    </div>

    <div v-else-if="selectedSecret" class="flex flex-col h-full">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <input
          v-model="editingSecret.name"
          class="w-full text-lg font-semibold bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none"
          placeholder="Secret name"
        >
      </div>

      <div class="p-3 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
        <button @click="saveSecret" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">Save</button>
        <button @click="deleteSecret" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Delete</button>
        <button @click="cancelEdit" class="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-300 rounded">Cancel</button>
      </div>

      <div class="p-3 flex-1 overflow-auto">
        <div class="mb-4">
          <label class="block text-xs text-zinc-500 mb-1">Environment</label>
          <select v-model="editingSecret.env" class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
            <option value="">All Environments</option>
            <option v-for="env in environments" :key="env.id" :value="env.id">{{ env.name }}</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-xs text-zinc-500 mb-1">Value</label>
          <div class="relative">
            <input
              v-model="editingSecret.value"
              :type="showSecretValue ? 'text' : 'password'"
              class="w-full px-3 py-2 pr-10 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
              placeholder="Secret value"
            >
            <button
              @click="showSecretValue = !showSecretValue"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
            >
              {{ showSecretValue ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="p-4 text-center text-zinc-500">
      Select a secret from the sidebar to view its details
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '../../stores';
import { useEnvironmentsStore } from '../../stores/environments';
import { useSecretsStore } from '../../stores/secrets';

const store = useAppStore();
const environmentsStore = useEnvironmentsStore();
const secretsStore = useSecretsStore();

const showSecretValue = ref(false);
const editingSecret = ref<{ id: string; name: string; env: string; value: string }>({ id: '', name: '', env: '', value: '' });
const environments = computed(() => environmentsStore.environments);

const selectedSecret = computed(() => {
  if (!store.selectedSecretId) return null;
  return store.secrets.find(s => s.id === store.selectedSecretId) || null;
});

watch(() => store.selectedSecretId, (newId) => {
  if (newId) {
    const secret = store.secrets.find(s => s.id === newId);
    if (secret) {
      editingSecret.value = { ...secret };
    }
  } else {
    editingSecret.value = { id: '', name: '', env: '', value: '' };
  }
}, { immediate: true });

function saveSecret() {
  if (!editingSecret.value.id || !secretsStore.isUnlocked) return;

  const index = store.secrets.findIndex(s => s.id === editingSecret.value.id);
  if (index !== -1) {
    store.secrets.splice(index, 1, { ...editingSecret.value });
  }

  const encryptedSecrets = store.secrets.map(s => ({
    ...s,
    value: secretsStore.simpleEncrypt(s.value, secretsStore.encryptionKey)
  }));
  localStorage.setItem('hailstorm_secrets', JSON.stringify(encryptedSecrets));
}

function deleteSecret() {
  if (!editingSecret.value.id || !secretsStore.isUnlocked) return;

  // Remove from store
  store.secrets = store.secrets.filter(s => s.id !== editingSecret.value.id);

  // Clear selection
  store.selectedSecretId = store.secrets.length > 0 ? store.secrets[0].id : null;

  // Update localStorage
  const encryptedSecrets = store.secrets.map(s => ({
    ...s,
    value: secretsStore.simpleEncrypt(s.value, secretsStore.encryptionKey)
  }));
  localStorage.setItem('hailstorm_secrets', JSON.stringify(encryptedSecrets));
}

function cancelEdit() {
  const secret = store.secrets.find(s => s.id === editingSecret.value.id);
  if (secret) {
    editingSecret.value = { ...secret };
  }
}
</script>