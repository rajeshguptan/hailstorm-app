<template>
  <div class="shell-script-detail flex flex-col h-full" style="height: 100%;" ref="container">
    <ShellRequest :style="{ height: requestHeight + 'px' }" />
    <div 
      class="resize-handle h-1 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 cursor-row-resize"
      @mousedown="startResize"
    ></div>
    <ShellResponse :style="{ flex: 1, minHeight: '100px' }" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ShellRequest from './ShellRequest.vue';
import ShellResponse from './ShellResponse.vue';

const container = ref<HTMLElement | null>(null);
const requestHeight = ref(220);
let isResizing = false;
let startY = 0;
let startHeight = 0;

function startResize(e: MouseEvent) {
  isResizing = true;
  startY = e.clientY;
  startHeight = requestHeight.value;
  
  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const delta = e.clientY - startY;
    const newHeight = startHeight + delta;
    if (newHeight >= 150 && newHeight <= 500) {
      requestHeight.value = newHeight;
    }
  };
  
  const onMouseUp = () => {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
</script>