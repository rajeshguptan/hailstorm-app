import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSecretsStore = defineStore('secrets', () => {
  const encryptionKey = ref<string>('');
  const isUnlocked = ref(false);
  const showEncryptionModal = ref(false);

  const isLocked = computed(() => !isUnlocked.value);

  // Simple encryption/decryption functions
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

  function checkEncryptionKey(): boolean {
    const storedKey = localStorage.getItem('hailstorm_encryption_key');
    return !!storedKey;
  }

  function setEncryptionKey(key: string) {
    encryptionKey.value = key;
    isUnlocked.value = true;
    showEncryptionModal.value = false;
  }

  function checkEncryptionKey(): boolean {
    const storedKey = localStorage.getItem('hailstorm_encryption_key');
    return !!storedKey;
  }

  function unlock(key: string): boolean {
    const storedKey = localStorage.getItem('hailstorm_encryption_key');
    if (storedKey === key) {
      encryptionKey.value = key;
      isUnlocked.value = true;
      showEncryptionModal.value = false;
      return true;
    }
    return false;
  }

  function lock() {
    encryptionKey.value = '';
    isUnlocked.value = false;
  }

  function changeEncryptionKey(oldKey: string, newKey: string): boolean {
    if (encryptionKey.value === oldKey) {
      // Re-encrypt all secrets with new key
      const appStore = useAppStore();
      const currentSecrets = [...appStore.secrets];

      // Decrypt with old key and encrypt with new key
      const reEncryptedSecrets = currentSecrets.map(secret => ({
        ...secret,
        value: simpleEncrypt(simpleDecrypt(secret.value, oldKey), newKey)
      }));

      // Update localStorage
      localStorage.setItem('hailstorm_secrets', JSON.stringify(reEncryptedSecrets));
      localStorage.setItem('hailstorm_encryption_key', newKey);

      encryptionKey.value = newKey;
      return true;
    }
    return false;
  }

  function showUnlockModal() {
    showEncryptionModal.value = true;
  }

  function hideUnlockModal() {
    showEncryptionModal.value = false;
  }

  return {
    // State
    encryptionKey,
    isUnlocked,
    showEncryptionModal,

    // Computed
    isLocked,

    // Functions
    simpleEncrypt,
    simpleDecrypt,
    checkEncryptionKey,
    setEncryptionKey,
    unlock,
    lock,
    changeEncryptionKey,
    showUnlockModal,
    hideUnlockModal
  };
});

// Import here to avoid circular dependency
import { useAppStore } from './index';