<template>
  <div class="secrets-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="secrets-content flex-1 overflow-auto">
      <div v-if="!secretsStore.isUnlocked" class="p-4 text-center">
        <div class="text-zinc-500 dark:text-zinc-400 mb-4">
          🔒 Secrets are locked. Please unlock using the encryption key.
        </div>
      </div>

      <div v-else class="p-2">
        <!-- Search/Filter Section -->
        <div class="mb-3">
          <div class="relative mb-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search secrets..."
              class="w-full px-3 py-2 pl-8 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
            >
            <svg class="absolute left-2 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div v-if="filteredSecrets.length === 0" class="text-center text-zinc-500 py-4 text-sm">
          {{ searchQuery ? 'No matching secrets found' : 'No secrets defined' }}
        </div>
        
        <div
          v-for="secret in filteredSecrets"
          :key="secret.id"
          class="p-2 mb-1 rounded cursor-pointer bg-zinc-100 dark:bg-zinc-800"
          :class="{ 'bg-zinc-200 dark:bg-zinc-700': appStore.selectedSecretId === secret.id }"
          @click="selectSecret(secret.id)"
        >
          <div class="flex items-center">
            <span class="text-sm text-zinc-900 dark:text-white">{{ secret.name || 'Unnamed' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '../../stores';
import { useSecretsStore } from '../../stores/secrets';
import { logger } from '../../utils/logger';

const appStore = useAppStore();
const secretsStore = useSecretsStore();

const searchQuery = ref('');
const secrets = computed(() => {
  logger.debug('[DEBUG] secrets computed, length:', appStore.secrets.length);
  return appStore.secrets;
});

const filteredSecrets = computed(() => {
  if (!searchQuery.value.trim()) {
    return secrets.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return secrets.value.filter((secret) => {
    return secret.name.toLowerCase().includes(query);
  });
});

function saveSecrets() {
  if (!secretsStore.isUnlocked) return;

  const encryptedSecrets = appStore.secrets.map(s => ({
    ...s,
    value: secretsStore.simpleEncrypt(s.value, secretsStore.encryptionKey)
  }));
  localStorage.setItem('hailstorm_secrets', JSON.stringify(encryptedSecrets));
}

function selectSecret(id: string) {
  appStore.selectedSecretId = id;
}

function getSecretValue(id: string): string {
  const secret = appStore.secrets.find(s => s.id === id);
  return secret?.value || '';
}

function loadSecrets() {
  if (!secretsStore.isUnlocked) return;

  const saved = localStorage.getItem('hailstorm_secrets');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appStore.secrets = parsed.map((s: any) => ({
        ...s,
        value: secretsStore.simpleDecrypt(s.value, secretsStore.encryptionKey)
      }));
    } catch (e) {
      console.error('Error parsing secrets:', e);
    }
  }
}

// Load secrets when unlocked
watch(() => secretsStore.isUnlocked, (unlocked) => {
  if (unlocked) {
    loadSecrets();
  }
}, { immediate: true });

defineExpose({
  secrets,
  selectedSecretId: () => appStore.selectedSecretId,
  selectSecret,
  getSecretValue,
  saveSecrets
});
</script>
