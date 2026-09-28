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

    <template v-else>
      <!-- Editor toolbar -->
      <div class="flex items-center flex-wrap gap-1 mb-2 px-2 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-md bg-zinc-50 dark:bg-zinc-800/60">
        <select
          :value="blockStyle"
          @change="applyBlockStyle"
          class="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          title="Block style"
          aria-label="Block style"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>

        <span class="w-px h-5 bg-zinc-300 dark:bg-zinc-600 mx-1" aria-hidden="true"></span>

        <button type="button" @mousedown.prevent @click="applyInline('bold')" class="tb-btn font-bold" title="Bold">B</button>
        <button type="button" @mousedown.prevent @click="applyInline('italic')" class="tb-btn italic" title="Italic">I</button>
        <button type="button" @mousedown.prevent @click="applyInline('strikeThrough')" class="tb-btn line-through" title="Strikethrough">S</button>
        <button type="button" @mousedown.prevent @click="applyLink()" class="tb-btn" title="Link">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path></svg>
        </button>

        <span class="w-px h-5 bg-zinc-300 dark:bg-zinc-600 mx-1" aria-hidden="true"></span>

        <button type="button" @mousedown.prevent @click="applyList('ul')" class="tb-btn" title="Bulleted List">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"></path><circle cx="3.5" cy="6" r="1"></circle><circle cx="3.5" cy="12" r="1"></circle><circle cx="3.5" cy="18" r="1"></circle></svg>
        </button>
        <button type="button" @mousedown.prevent @click="applyList('ol')" class="tb-btn font-mono text-xs" title="Numbered List">1.</button>
        <button type="button" @mousedown.prevent @click="applyTaskList()" class="tb-btn" title="Checklist">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>
        </button>
        <button type="button" @mousedown.prevent @click="applyTable()" class="tb-btn" title="Table">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>
        </button>

        <span class="w-px h-5 bg-zinc-300 dark:bg-zinc-600 mx-1" aria-hidden="true"></span>

        <button type="button" @mousedown.prevent @click="applyInlineCode()" class="tb-btn font-mono text-xs" title="Inline Code">&lt;/&gt;</button>
        <button type="button" @mousedown.prevent @click="applyCodeBlock()" class="tb-btn" title="Code Block">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path></svg>
        </button>
        <button type="button" @mousedown.prevent @click="applyHr()" class="tb-btn" title="Divider">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18"></path></svg>
        </button>

        <div class="flex-1"></div>

        <div class="flex rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-600" role="group" aria-label="Editor mode">
          <button type="button" @click="setEditMode('rich')" :aria-pressed="editMode === 'rich'" class="px-2.5 py-1 text-xs font-medium" :class="editMode === 'rich' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'">Rich Text</button>
          <button type="button" @click="setEditMode('markdown')" :aria-pressed="editMode === 'markdown'" class="px-2.5 py-1 text-xs font-medium border-l border-zinc-300 dark:border-zinc-600" :class="editMode === 'markdown' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'">Markdown</button>
        </div>
      </div>

      <!-- Rich Text editing surface -->
      <div
        v-if="editMode === 'rich'"
        ref="editorRef"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        aria-label="Description editor"
        data-placeholder="Enter description..."
        class="doc-editor markdown-content w-full min-h-[14rem] max-h-[32rem] overflow-auto px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="onEditorInput"
      ></div>

      <!-- Markdown editing surface -->
      <textarea
        v-else
        ref="textareaRef"
        v-model="editValue"
        class="w-full h-64 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none font-mono text-sm"
        placeholder="Enter description in Markdown format..."
        aria-label="Markdown description editor"
      ></textarea>
    </template>
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
.tb-btn {
  @apply px-1.5 py-1 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded;
}
.doc-editor:empty::before {
  content: attr(data-placeholder);
  @apply text-zinc-400 dark:text-zinc-500 italic;
}
</style>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isEditing = ref(false);
const editValue = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const editMode = ref<'rich' | 'markdown'>('rich');
const editorRef = ref<HTMLDivElement | null>(null);
const blockStyle = ref('p');

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
  blockStyle.value = 'p';
  editMode.value = 'rich';
  isEditing.value = true;
  seedEditor();
}

function save() {
  emit('update:modelValue', editValue.value);
  isEditing.value = false;
}

function cancel() {
  editValue.value = props.modelValue || '';
  isEditing.value = false;
}

function setEditMode(mode: 'rich' | 'markdown') {
  if (editMode.value === mode) return;
  if (editMode.value === 'rich') {
    syncFromEditor();
    editMode.value = mode;
  } else {
    editMode.value = mode;
    seedEditor();
  }
}

function seedEditor() {
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.innerHTML = renderMarkdown(editValue.value || '');
    }
  });
}

function onEditorInput() {
  syncFromEditor();
}

function syncFromEditor() {
  if (editorRef.value) {
    editValue.value = htmlToMarkdown(editorRef.value);
  }
}

function applyInline(command: 'bold' | 'italic' | 'strikeThrough') {
  if (editMode.value === 'rich') {
    document.execCommand(command);
    syncFromEditor();
  } else if (command === 'bold') {
    insertFormat('**', '**');
  } else if (command === 'italic') {
    insertFormat('*', '*');
  } else {
    insertFormat('~~', '~~');
  }
}

function applyLink() {
  if (editMode.value === 'rich') {
    document.execCommand('createLink', false, 'https://');
    syncFromEditor();
  } else {
    insertFormat('[', '](https://)');
  }
}

function applyList(kind: 'ul' | 'ol') {
  if (editMode.value === 'rich') {
    document.execCommand(kind === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    syncFromEditor();
  } else {
    insertLine(kind === 'ul' ? '- ' : '1. ', '');
  }
}

function applyTaskList() {
  if (editMode.value === 'rich') {
    const text = window.getSelection()?.toString() || 'Task';
    document.execCommand('insertHTML', false, `<ul><li><input type="checkbox"> ${escapeHtmlText(text)}</li></ul>`);
    syncFromEditor();
  } else {
    insertLine('- [ ] ', '');
  }
}

function applyInlineCode() {
  if (editMode.value === 'rich') {
    const text = window.getSelection()?.toString() || 'code';
    document.execCommand('insertHTML', false, `<code>${escapeHtmlText(text)}</code>`);
    syncFromEditor();
  } else {
    insertFormat('`', '`');
  }
}

function applyCodeBlock() {
  if (editMode.value === 'rich') {
    const text = window.getSelection()?.toString() || 'code';
    document.execCommand('insertHTML', false, `<pre><code>${escapeHtmlText(text)}</code></pre><p><br></p>`);
    syncFromEditor();
  } else {
    insertFormat('```\n', '\n```');
  }
}

function applyHr() {
  if (editMode.value === 'rich') {
    document.execCommand('insertHorizontalRule');
    syncFromEditor();
  } else {
    insertLine('---', '');
  }
}

function applyTable() {
  if (editMode.value === 'rich') {
    const html = '<table><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></tbody></table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    syncFromEditor();
  } else {
    insertTable();
  }
}

function applyBlockStyle(event: Event) {
  const tag = (event.target as HTMLSelectElement).value;
  blockStyle.value = tag;
  if (editMode.value === 'rich' && editorRef.value) {
    editorRef.value.focus();
    document.execCommand('formatBlock', false, tag);
    syncFromEditor();
  } else {
    applyBlockMarkdown(tag);
  }
}

function applyBlockMarkdown(tag: string) {
  const textarea = textareaRef.value;
  if (!textarea) return;
  const prefixes: Record<string, string> = { p: '', h1: '# ', h2: '## ', h3: '### ', blockquote: '> ' };
  const prefix = prefixes[tag] ?? '';
  const start = textarea.selectionStart;
  const lineStart = editValue.value.lastIndexOf('\n', Math.max(start - 1, 0)) + 1;
  const newlineIndex = editValue.value.indexOf('\n', start);
  const lineEnd = newlineIndex === -1 ? editValue.value.length : newlineIndex;
  const line = editValue.value.substring(lineStart, lineEnd);
  const stripped = line.replace(/^(#{1,3}\s+|>\s+|-\s+\[[ x]\]\s+|-\s+|\d+\.\s+)/, '');
  const newLine = prefix + stripped;
  editValue.value = editValue.value.substring(0, lineStart) + newLine + editValue.value.substring(lineEnd);
  textarea.focus();
  textarea.setSelectionRange(lineStart + prefix.length, lineStart + newLine.length);
}

function escapeHtmlText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function htmlToMarkdown(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  const raw = serializeChildren(clone).replace(/\u00a0/g, ' ');
  return raw.replace(/\n{3,}/g, '\n\n').trim();
}

function serializeChildren(el: HTMLElement): string {
  return Array.from(el.childNodes).map(serializeNode).join('');
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const inner = serializeChildren(el);
  switch (el.tagName) {
    case 'BR': return '\n';
    case 'HR': return '\n---\n';
    case 'H1': return `\n# ${inner}`;
    case 'H2': return `\n## ${inner}`;
    case 'H3': return `\n### ${inner}`;
    case 'STRONG': case 'B': return `**${inner}**`;
    case 'EM': case 'I': return `*${inner}*`;
    case 'DEL': case 'S': return `~~${inner}~~`;
    case 'CODE': return el.parentElement?.tagName === 'PRE' ? inner : `\`${inner}\``;
    case 'PRE': return `\n\`\`\`\n${inner}\n\`\`\`\n`;
    case 'A': return `[${inner}](${el.getAttribute('href') || ''})`;
    case 'IMG': return `![${el.getAttribute('alt') || ''}](${el.getAttribute('src') || ''})`;
    case 'UL': return `\n${serializeList(el, false)}`;
    case 'OL': return `\n${serializeList(el, true)}`;
    case 'BLOCKQUOTE': return `\n> ${inner.trim().replace(/\n+/g, '\n> ')}\n`;
    case 'TABLE': return `\n${tableToMarkdown(el)}\n`;
    case 'P': case 'DIV': return inner.trim() ? `\n${inner}\n` : '\n';
    case 'INPUT': return '';
    default: return inner;
  }
}

function serializeList(list: HTMLElement, ordered: boolean): string {
  return Array.from(list.children)
    .filter(child => child.tagName === 'LI')
    .map((child, index) => {
      const li = child as HTMLElement;
      const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      let marker = ordered ? `${index + 1}. ` : '- ';
      let content: string;
      if (checkbox) {
        marker += checkbox.checked ? '[x] ' : '[ ] ';
        const liClone = li.cloneNode(true) as HTMLElement;
        liClone.querySelectorAll('input[type="checkbox"]').forEach(node => node.remove());
        content = serializeChildren(liClone).trim();
      } else {
        content = serializeChildren(li).trim();
      }
      content = content.split('\n').map((line, i) => (i === 0 ? line : '  ' + line)).join('\n');
      return marker + content;
    })
    .join('\n');
}

function tableToMarkdown(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';
  const cellsOf = (row: HTMLElement) => Array.from(row.children).map(cell => (cell.textContent || '').trim());
  const header = cellsOf(rows[0] as HTMLElement);
  const separator = `|${header.map(() => ' --- ').join('|')}|`;
  const toLine = (cells: string[]) => `| ${cells.join(' | ')} |`;
  const body = rows.slice(1).map(row => toLine(cellsOf(row as HTMLElement)));
  return [toLine(header), separator, ...body].join('\n');
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