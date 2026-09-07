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
          <div class="flex gap-1 mr-2 flex-wrap">
            <button @click="insertFormat('**', '**')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded font-bold text-sm" title="Bold (Ctrl+B)">B</button>
            <button @click="insertFormat('*', '*')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded italic text-sm" title="Italic (Ctrl+I)">I</button>
            <button @click="insertFormat('~~', '~~')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded line-through text-sm" title="Strikethrough">S</button>
            <button @click="insertFormat('`', '`')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded font-mono text-sm" title="Inline Code">&#60;/&#62;</button>
            <button @click="insertFormat('[', '](url)')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Link">Link</button>
            <button @click="insertFormat('![alt](', ')')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Image">Img</button>
            <div class="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 my-auto"></div>
            <button @click="insertLine('# ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm font-bold" title="Heading 1">H1</button>
            <button @click="insertLine('## ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm font-semibold" title="Heading 2">H2</button>
            <button @click="insertLine('### ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Heading 3">H3</button>
            <div class="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 my-auto"></div>
            <button @click="insertLine('- ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Bullet List">&#8226;</button>
            <button @click="insertLine('1. ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Numbered List">1.</button>
            <button @click="insertLine('- [ ] ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Task List">&#9744;</button>
            <div class="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 my-auto"></div>
            <button @click="insertLine('> ', '')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Blockquote">&#8226;&#8226;&#8226;</button>
            <button @click="insertLine('---', '\n')" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Horizontal Rule">&#8213;</button>
            <button @click="insertTable()" class="p-1 text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded text-sm" title="Table">&#9632;</button>
          </div>
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
      ref="textareaRef"
      v-model="editValue"
      class="w-full h-64 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
      placeholder="Enter description in Markdown format..."
    ></textarea>
  </div>
</template>

<style scoped>
.markdown-content :deep(h1) {
  @apply text-xl font-bold mb-3 mt-4 first:mt-0;
}
.markdown-content :deep(h2) {
  @apply text-lg font-semibold mb-2 mt-4 first:mt-0;
}
.markdown-content :deep(h3) {
  @apply text-base font-medium mb-2 mt-3 first:mt-0;
}
.markdown-content :deep(p) {
  @apply mb-3 leading-relaxed;
}
.markdown-content :deep(strong) {
  @apply font-semibold;
}
.markdown-content :deep(em) {
  @apply italic;
}
.markdown-content :deep(code) {
  @apply bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono;
}
.markdown-content :deep(pre) {
  @apply bg-zinc-100 dark:bg-zinc-800 p-3 rounded mb-3 overflow-x-auto;
}
.markdown-content :deep(pre code) {
  @apply bg-transparent p-0;
}
.markdown-content :deep(ul) {
  @apply list-disc list-inside mb-3 space-y-1;
}
.markdown-content :deep(ol) {
  @apply list-decimal list-inside mb-3 space-y-1;
}
.markdown-content :deep(li) {
  @apply leading-relaxed;
}
.markdown-content :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}
.markdown-content :deep(img) {
  @apply max-w-full h-auto rounded my-3;
}
.markdown-content :deep(blockquote) {
  @apply border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 py-1 my-3 text-zinc-600 dark:text-zinc-400 italic;
}
.markdown-content :deep(hr) {
  @apply border-t border-zinc-300 dark:border-zinc-600 my-4;
}
.markdown-content :deep(table) {
  @apply w-full border-collapse my-3;
}
.markdown-content :deep(th) {
  @apply border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-left font-semibold;
}
.markdown-content :deep(td) {
  @apply border border-zinc-300 dark:border-zinc-600 px-3 py-2;
}
.markdown-content :deep(tr:nth-child(even)) {
  @apply bg-zinc-50 dark:bg-zinc-800/50;
}
.markdown-content :deep(input[type="checkbox"]) {
  @apply mr-2;
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
const textareaRef = ref<HTMLTextAreaElement | null>(null);

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

function insertFormat(before: string, after: string) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = editValue.value.substring(start, end);

  editValue.value =
    editValue.value.substring(0, start) +
    before + selectedText + after +
    editValue.value.substring(end);

  textarea.focus();
  textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
}

function insertLine(prefix: string, suffix: string) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = editValue.value.substring(start, end);

  // If multiple lines selected, prefix each line
  if (selectedText.includes('\n')) {
    const lines = selectedText.split('\n');
    const prefixedLines = lines.map(line => prefix + line + suffix);
    editValue.value =
      editValue.value.substring(0, start) +
      prefixedLines.join('\n') +
      editValue.value.substring(end);
  } else {
    editValue.value =
      editValue.value.substring(0, start) +
      prefix + selectedText + suffix +
      editValue.value.substring(end);
  }

  textarea.focus();
  textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
}

function insertTable() {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const tableMarkdown = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;

  const start = textarea.selectionStart;
  editValue.value =
    editValue.value.substring(0, start) +
    (editValue.value && !editValue.value.endsWith('\n') ? '\n' : '') +
    tableMarkdown +
    '\n' +
    editValue.value.substring(start);

  textarea.focus();
  textarea.setSelectionRange(start + 1, start + 1);
}

function renderMarkdown(text: string): string {
  let html = text;

  // Escape HTML (but preserve markdown syntax characters)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  html = html.replace(/^___$/gm, '<hr>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Images (before other processing)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Tables (simple regex-based)
  const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm;
  html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map((row: string) =>
      row.split('|').map((cell: string) => cell.trim()).filter(Boolean)
    );

    let tableHtml = '<table><thead><tr>';
    headers.forEach((h: string) => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    rows.forEach((row: string[]) => {
      tableHtml += '<tr>';
      row.forEach((cell: string) => {
        tableHtml += `<td>${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // Task lists
  html = html.replace(/^- \[x\] (.+)$/gim, '<li><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/^- \[ \] (.+)$/gim, '<li><input type="checkbox" disabled> $1</li>');
  html = html.replace(/^\* \[x\] (.+)$/gim, '<li><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/^\* \[ \] (.+)$/gim, '<li><input type="checkbox" disabled> $1</li>');

  // Process lists and paragraphs
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^- \[x\] (.+)$/i) || line.match(/^- \[ \] (.+)$/i) || line.match(/^- (.+)$/);
    const olMatch = line.match(/^\d+\. (.+)$/);

    if (line.startsWith('<blockquote>')) {
      if (!inBlockquote) {
        if (inList) {
          result.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        inBlockquote = true;
      }
      result.push(line);
    } else if (inBlockquote && !line.trim()) {
      result.push('</blockquote>');
      inBlockquote = false;
    } else if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        if (inBlockquote) {
          result.push('</blockquote>');
          inBlockquote = false;
        }
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        if (inBlockquote) {
          result.push('</blockquote>');
          inBlockquote = false;
        }
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      if (inBlockquote) {
        result.push('</blockquote>');
        inBlockquote = false;
      }
      if (line.trim() && !line.startsWith('<hr') && !line.startsWith('<table') && !line.startsWith('<pre') && !line.startsWith('<img')) {
        result.push(`<p>${line}</p>`);
      } else if (line.trim()) {
        result.push(line);
      }
    }
  }

  if (inList) {
    result.push(`</${listType}>`);
  }
  if (inBlockquote) {
    result.push('</blockquote>');
  }

  return result.join('\n');
}
</script>