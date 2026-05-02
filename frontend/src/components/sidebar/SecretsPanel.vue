<template>
  <div class="secrets-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="secrets-content flex-1 overflow-auto">
      <div v-if="!hasSalt" class="p-3 m-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
        <label class="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Encryption Salt</label>
        <input 
          v-model="salt" 
          type="password" 
          placeholder="Enter a salt for encryption"
          class="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white mb-2"
        >
        <button @click="saveSalt" class="text-xs px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded">Set Salt</button>
      </div>
      
      <div v-if="hasSalt" class="p-2">
        <!-- Search/Filter Section -->
        <div class="mb-3">
          <div class="relative mb-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search secrets (name, environment)..."
              class="w-full px-3 py-2 pl-8 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
            >
            <svg class="absolute left-2 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <button @click="addSecret" class="w-full text-xs px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded mb-2">+ Add Secret</button>
        
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
          <div class="text-xs text-zinc-500">{{ getEnvName(secret.env) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAppStore } from '../../stores';
import { useEnvironmentsStore } from '../../stores/environments';

const appStore = useAppStore();
const environmentsStore = useEnvironmentsStore();

const salt = ref('');
const searchQuery = ref('');
const secrets = computed(() => {
  console.log('[DEBUG] secrets computed, length:', appStore.secrets.length);
  return appStore.secrets;
});

const filteredSecrets = computed(() => {
  if (!searchQuery.value.trim()) {
    return secrets.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return secrets.value.filter((secret) => {
    return (
      secret.name.toLowerCase().includes(query) ||
      getEnvName(secret.env).toLowerCase().includes(query)
    );
  });
});

const hasSalt = computed(() => localStorage.getItem('hailstorm_salt') !== null);

function getEnvName(envId: string): string {
  if (!envId) return 'All';
  const env = environmentsStore.environments.find(e => e.id === envId);
  return env?.name || 'Unknown';
}

function simpleEncrypt(text: string, saltVal: string): string {
  if (!saltVal || !text) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ saltVal.charCodeAt(i % saltVal.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

function simpleDecrypt(encrypted: string, saltVal: string): string {
  if (!saltVal || !encrypted) return encrypted;
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ saltVal.charCodeAt(i % saltVal.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return encrypted;
  }
}

function saveSalt() {
  if (salt.value) {
    localStorage.setItem('hailstorm_salt', salt.value);
  }
}

function generateId(): string {
  return `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addSecret() {
  if (!hasSalt.value) return;
  const newSecret = { id: generateId(), name: '', env: '', value: '' };
  appStore.secrets.push(newSecret);
  appStore.selectedSecretId = newSecret.id;
  saveSecrets();
}



function saveSecrets() {
  const saltVal = localStorage.getItem('hailstorm_salt') || '';
  const encryptedSecrets = appStore.secrets.map(s => ({
    ...s,
    value: simpleEncrypt(s.value, saltVal)
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
  const saved = localStorage.getItem('hailstorm_secrets');
  const saltVal = localStorage.getItem('hailstorm_salt') || '';
  console.log('[DEBUG] SecretsPanel loadSecrets, saved:', saved, 'saltVal:', !!saltVal);
  if (saved && saltVal) {
    try {
      const parsed = JSON.parse(saved);
      console.log('[DEBUG] SecretsPanel loadSecrets, parsed secrets:', parsed.length);
      appStore.secrets = parsed.map((s: any) => ({
        ...s,
        value: simpleDecrypt(s.value, saltVal)
      }));
      console.log('[DEBUG] SecretsPanel loadSecrets, set appStore.secrets to:', appStore.secrets.length);
    } catch (e) {
      console.error('[DEBUG] SecretsPanel loadSecrets, error parsing:', e);
    }
  }
}

// Load secrets immediately
loadSecrets();

onMounted(() => {
  // Already loaded
});

defineExpose({
  secrets,
  selectedSecretId: () => appStore.selectedSecretId,
  selectSecret,
  getSecretValue,
  saveSecrets
});
</script>