<template>
  <div class="feedback-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="feedback-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <h5 class="mb-0 text-zinc-900 dark:text-white">Feedback</h5>
    </div>
    <div class="feedback-content flex-1 overflow-hidden">
      <iframe
        class="airtable-embed w-full h-full"
        src="https://airtable.com/embed/app3t7ozk8mGsgmrv/pagIaOAtKsQVxTfdW/form"
        frameborder="0"
        style="background: transparent; border: 1px solid #ccc;"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>