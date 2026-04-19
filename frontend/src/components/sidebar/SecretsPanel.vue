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
        <button @click="addSecret" class="w-full text-xs px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded mb-2">+ Add Secret</button>
        
        <div v-if="secrets.length === 0" class="text-center text-zinc-500 py-4 text-sm">
          No secrets defined
        </div>
        
        <div 
          v-for="secret in secrets" 
          :key="secret.id"
          class="p-2 mb-1 rounded cursor-pointer bg-zinc-100 dark:bg-zinc-800"
          :class="{ 'bg-zinc-200 dark:bg-zinc-700': store.selectedSecretId === secret.id }"
          @click="selectSecret(secret.id)"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-900 dark:text-white">{{ secret.name || 'Unnamed' }}</span>
            <button @click.stop="deleteSecret(secret.id)" class="text-red-500 hover:text-red-700 text-xl">×</button>
          </div>
          <div class="text-xs text-zinc-500">{{ getEnvName(secret.env) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAppStore } from '../../stores/app';

const store = useAppStore();

const salt = ref('');
const secrets = store.secrets;
const hasSalt = computed(() => localStorage.getItem('hailstorm_salt') !== null);

function getEnvName(envId: string): string {
  if (!envId) return 'All';
  const env = store.environments.find(e => e.id === envId);
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
  store.secrets.push(newSecret);
  store.selectedSecretId = newSecret.id;
  saveSecrets();
}

function deleteSecret(id: string) {
  store.secrets = store.secrets.filter(s => s.id !== id);
  if (store.selectedSecretId === id) {
    store.selectedSecretId = store.secrets.length > 0 ? store.secrets[0].id : null;
  }
  saveSecrets();
}

function saveSecrets() {
  const saltVal = localStorage.getItem('hailstorm_salt') || '';
  const encryptedSecrets = store.secrets.map(s => ({
    ...s,
    value: simpleEncrypt(s.value, saltVal)
  }));
  localStorage.setItem('hailstorm_secrets', JSON.stringify(encryptedSecrets));
}

function selectSecret(id: string) {
  store.selectedSecretId = id;
}

function getSecretValue(id: string): string {
  const secret = store.secrets.find(s => s.id === id);
  return secret?.value || '';
}

onMounted(() => {
  const saved = localStorage.getItem('hailstorm_secrets');
  const saltVal = localStorage.getItem('hailstorm_salt') || '';
  if (saved && saltVal) {
    try {
      const parsed = JSON.parse(saved);
      store.secrets = parsed.map((s: any) => ({
        ...s,
        value: simpleDecrypt(s.value, saltVal)
      }));
    } catch {}
  }
});

defineExpose({
  secrets,
  selectedSecretId: () => store.selectedSecretId,
  selectSecret,
  getSecretValue,
  saveSecrets
});
</script>