<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from './stores/app';

const store = useAppStore();

onMounted(() => {
  store.init();
});
</script>
