<template>
  <div v-if="store.showEnvModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="store.showEnvModal = false">
    <div class="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-4" style="width: 400px;" @click.stop>
      <h5 class="mb-3">Edit Environment</h5>
      <input v-model="store.editingEnv.name" type="text" class="form-input bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded mb-2 w-full px-3 py-2" placeholder="Environment Name" />
      <div class="mb-2">
        <div class="flex gap-2 mb-1">
          <span class="flex-1 text-sm text-zinc-500">Variable</span>
          <span class="flex-1 text-sm text-zinc-500">Value</span>
          <span style="width: 30px;"></span>
        </div>
        <div v-for="(v, i) in store.editingEnv.variables" :key="i" class="flex gap-2 mb-1">
          <input v-model="v.key" type="text" class="form-input bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1 text-sm" placeholder="Key" />
          <input v-model="v.value" type="text" class="form-input bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 flex-1 text-sm" placeholder="Value" />
          <button class="btn btn-sm border border-red-500 text-red-500 px-2" @click="store.editingEnv.variables.splice(i, 1)">×</button>
        </div>
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 mt-2 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="store.editingEnv.variables.push({ key: '', value: '', enabled: true })">+ Add Variable</button>
      </div>
      <div class="flex gap-2 justify-end mt-3">
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="store.showEnvModal = false">Cancel</button>
        <button class="btn btn-sm bg-blue-500 text-white hover:bg-blue-600" @click="store.saveEnvironment()">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/app';

const store = useAppStore();
</script>