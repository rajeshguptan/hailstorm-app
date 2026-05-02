<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from './stores';
import { useTheme } from './composables/useTheme';

const store = useAppStore();
const { loadTheme } = useTheme();

onMounted(async () => {
  loadTheme(); // Apply theme immediately on app start
  await store.init();
});
</script>
