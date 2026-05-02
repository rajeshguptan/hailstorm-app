<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeOnBackdrop">
    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-md w-full mx-4 p-6" @click.stop>
      <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
        {{ isFirstTime ? 'Set Encryption Key' : 'Enter Encryption Key' }}
      </h3>
        <button @click="closeModal" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="mb-4">
        <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          {{ isFirstTime
            ? 'Enter an encryption key to secure your secrets. This key will be used to encrypt secrets stored on disk.'
            : 'Enter your encryption key to unlock secrets.'
          }}
        </p>

        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Encryption Key
        </label>
        <input
          v-model="encryptionKey"
          type="password"
          class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter encryption key"
          @keyup.enter="submitKey"
          ref="keyInput"
        >

        <div v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="closeModal"
          class="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          @click="submitKey"
          :disabled="!encryptionKey.trim()"
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-md"
        >
          {{ isFirstTime ? 'Set Key' : 'Unlock' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'submit', key: string): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const encryptionKey = ref('');
const error = ref('');
const keyInput = ref<HTMLInputElement>();

const isFirstTime = computed(() => {
  return !localStorage.getItem('hailstorm_encryption_key');
});

watch(() => props.show, async (newShow) => {
  if (newShow) {
    encryptionKey.value = '';
    error.value = '';
    await nextTick();
    keyInput.value?.focus();
  }
});

function submitKey() {
  if (!encryptionKey.value.trim()) {
    error.value = 'Please enter an encryption key';
    return;
  }

  emit('submit', encryptionKey.value.trim());
}

function closeModal() {
  emit('close');
}

function closeOnBackdrop() {
  // Only allow closing on backdrop click if not first time setup
  if (!isFirstTime.value) {
    closeModal();
  }
}
</script>