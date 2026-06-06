<template>
  <div class="markdown-description relative">
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
      <div class="flex gap-1">
        <template v-if="!isEditing">
          <button @click="startEdit" class="p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded" title="Edit">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
        </template>
        <template v-else>
          <button @click="save" class="p-1 text-green-600 hover:text-green-700 rounded" title="Save">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </button>
          <button @click="cancel" class="p-1 text-red-600 hover:text-red-700 rounded" title="Cancel">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </template>
      </div>
    </div>

    <div v-if="!isEditing" class="text-zinc-900 dark:text-zinc-100">
      <div v-if="modelValue" v-html="renderedMarkdown" class="markdown-content"></div>
      <div v-else class="text-zinc-500 italic">No description provided</div>
    </div>

    <textarea
      v-else
      v-model="editValue"
      class="w-full h-64 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
      placeholder="Enter description in Markdown format..."
    ></textarea>
  </div>
</template>

<style scoped>
.markdown-content :deep(h1) {
  @apply text-xl font-bold mb-3;
}
.markdown-content :deep(h2) {
  @apply text-lg font-semibold mb-2;
}
.markdown-content :deep(h3) {
  @apply text-base font-medium mb-2;
}
.markdown-content :deep(p) {
  @apply mb-2;
}
.markdown-content :deep(strong) {
  @apply font-semibold;
}
.markdown-content :deep(em) {
  @apply italic;
}
.markdown-content :deep(code) {
  @apply bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-sm font-mono;
}
.markdown-content :deep(pre) {
  @apply bg-zinc-100 dark:bg-zinc-800 p-2 rounded mb-2 overflow-x-auto;
}
.markdown-content :deep(pre code) {
  @apply bg-transparent p-0;
}
.markdown-content :deep(ul) {
  @apply list-disc list-inside mb-2;
}
.markdown-content :deep(ol) {
  @apply list-decimal list-inside mb-2;
}
.markdown-content :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isEditing = ref(false);
const editValue = ref('');

const renderedMarkdown = computed(() => {
   const md = props.modelValue || '';
   return renderMarkdown(md);
 });

 watch(() => props.modelValue, (newVal) => {
   if (!isEditing.value) {
     editValue.value = newVal || '';
   }
}, { immediate: true });

function startEdit() {
  editValue.value = props.modelValue || '';
  isEditing.value = true;
}

function save() {
  emit('update:modelValue', editValue.value);
  isEditing.value = false;
}

function cancel() {
  editValue.value = props.modelValue || '';
  isEditing.value = false;
}

function renderMarkdown(text: string): string {
  let html = text;

  // Escape HTML
  html = html.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-zinc-100 dark:bg-zinc-800 p-2 rounded"><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">$1</code>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>');

  // Lists
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^- (.+)$/);
    const olMatch = line.match(/^(\d+)\. (.+)$/);

    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      if (line.trim()) {
        result.push(`<p class="mb-2">${line}</p>`);
      }
    }
  }

  if (inList) {
    result.push(`</${listType}>`);
  }

  return result.join('\n');
}
</script>