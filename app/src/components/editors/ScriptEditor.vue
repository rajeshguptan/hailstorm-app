<template>
  <div class="script-editor h-full w-full" ref="editorContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult } from '@codemirror/autocomplete';

interface ScriptEditorProps {
  modelValue?: string;
  placeholder?: string;
  scriptType?: 'pre-request' | 'post-request' | 'test';
}

const props = defineProps<ScriptEditorProps>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorContainer = ref<HTMLElement | null>(null);
const editorView = shallowRef<EditorView | null>(null);

interface CompletionItem {
  label: string;
  type: 'variable' | 'function' | 'keyword' | 'type' | 'property' | 'namespace' | 'class' | 'interface' | 'struct' | 'enum' | 'enumMember' | 'constant' | 'constructor' | 'event' | 'field' | 'typeParameter';
  detail?: string;
  info?: string;
}

const hailstormCompletions: CompletionItem[] = [
  { label: 'hs', type: 'variable', detail: 'Hailstorm API object' },
  { label: 'hs.output', type: 'variable', detail: 'Response output (shell only)', info: 'The shell command output string' },
  { label: 'hs.setEnv', type: 'function', detail: 'Set environment variable', info: 'hs.setEnv(key: string, value: string)' },
  { label: 'hs.getEnv', type: 'function', detail: 'Get environment variable', info: 'hs.getEnv(key: string): string | undefined' },
  { label: 'pm', type: 'variable', detail: 'Postman-compatible API' },
  { label: 'pm.environment', type: 'variable', detail: 'Environment object' },
  { label: 'pm.environment.set', type: 'function', detail: 'Set environment variable' },
  { label: 'pm.environment.get', type: 'function', detail: 'Get environment variable' },
  { label: 'pm.globals', type: 'variable', detail: 'Global variables' },
  { label: 'pm.globals.set', type: 'function', detail: 'Set global variable' },
  { label: 'pm.globals.get', type: 'function', detail: 'Get global variable' },
];

function hailstormCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w+/);
  
  if (!word) return null;
  
  const before = context.state.doc.sliceString(0, word.from);
  const afterDot = /([.\w]+)$/.exec(before);
  
  if (afterDot && afterDot[1]) {
    const prefix = afterDot[1];
    
    if (prefix.endsWith('.')) {
      const base = prefix.slice(0, -1);
      const matching = hailstormCompletions.filter(c => 
        c.label.startsWith(base + '.') && c.label !== base + '.'
      );
      if (matching.length > 0) {
        return {
          from: word.from,
          to: word.to,
          options: matching.map(c => ({
            label: c.label.slice(base.length + 1),
            type: c.type,
            detail: c.detail,
            info: c.info
          }))
        };
      }
    }
  }
  
  const filtered = hailstormCompletions.filter(c => 
    c.label.toLowerCase().includes(word.text.toLowerCase()) ||
    (word.text.startsWith('.') && c.label.includes(word.text.slice(1)))
  );
  
  return {
    from: word.from,
    to: word.to,
    options: filtered
  };
}

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

onMounted(() => {
  if (!editorContainer.value) return;

  const extensions = [
    javascript(),
    autocompletion({
      override: [hailstormCompletionSource]
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        emit('update:modelValue', newValue);
      }
    }),
    EditorView.lineWrapping
  ];

  // Apply dark theme only when in dark mode
  if (isDarkMode()) {
    extensions.push(oneDark);
  }

  const startState = EditorState.create({
    doc: props.modelValue || '',
    extensions
  });

  editorView.value = new EditorView({
    state: startState,
    parent: editorContainer.value
  });
});

onBeforeUnmount(() => {
  editorView.value?.destroy();
});

watch(() => props.modelValue, (newValue) => {
  if (editorView.value && newValue !== undefined) {
    const currentDoc = editorView.value.state.doc.toString();
    if (newValue !== currentDoc) {
      editorView.value.dispatch({
        changes: { 
          from: 0, 
          to: currentDoc.length, 
          insert: newValue 
        }
      });
    }
  }
});
</script>

<style>
.script-editor :deep(.cm-editor) {
  height: 100%;
  outline: none;
}
</style>