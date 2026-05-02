<template>
  <div class="settings-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300">
    <div class="settings-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <h3 class="font-semibold text-zinc-900 dark:text-white">Settings</h3>
    </div>
    <div class="settings-content flex-1 overflow-auto p-4">
      <div class="setting-group mb-6">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Appearance</h4>
        <div class="space-y-2">
          <label class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" :class="{ 'bg-zinc-100 dark:bg-zinc-800': theme === 'light' }">
            <input type="radio" name="theme" value="light" v-model="theme" @change="setTheme(theme)" class="w-4 h-4">
            <span class="text-zinc-800 dark:text-zinc-300">Light</span>
          </label>
          <label class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" :class="{ 'bg-zinc-100 dark:bg-zinc-800': theme === 'dark' }">
            <input type="radio" name="theme" value="dark" v-model="theme" @change="setTheme(theme)" class="w-4 h-4">
            <span class="text-zinc-800 dark:text-zinc-300">Dark</span>
          </label>
          <label class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" :class="{ 'bg-zinc-100 dark:bg-zinc-800': theme === 'system' }">
            <input type="radio" name="theme" value="system" v-model="theme" @change="setTheme(theme)" class="w-4 h-4">
            <span class="text-zinc-800 dark:text-zinc-300">System</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme';

const { theme, setTheme } = useTheme();


</script>
