<template>
  <div class="settings-content h-full flex">
    <div class="settings-nav w-56 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
      <div class="p-3">
        <div class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">User Interface</div>
        <div class="space-y-1">
          <button 
            v-for="item in uiItems" 
            :key="item.id"
            class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
            :class="activeSection === item.id ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
            @click="activeSection = item.id"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      
      <div class="p-3">
        <div class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Application</div>
        <div class="space-y-1">
          <button 
            v-for="item in appItems" 
            :key="item.id"
            class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
            :class="activeSection === item.id ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
            @click="activeSection = item.id"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      
      <div class="p-3">
        <div class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Advanced</div>
        <div class="space-y-1">
          <button 
            v-for="item in advancedItems" 
            :key="item.id"
            class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
            :class="activeSection === item.id ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
            @click="activeSection = item.id"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="settings-panel flex-1 overflow-auto p-6">
      <div v-if="activeSection === 'theme'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Theme</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Choose your preferred color scheme</p>
        
        <div class="grid grid-cols-3 gap-4">
          <label 
            v-for="opt in themeOptions" 
            :key="opt.value"
            class="relative cursor-pointer"
          >
            <input type="radio" name="theme" :value="opt.value" v-model="theme" class="sr-only" @change="applyTheme">
            <div 
              class="p-4 rounded-lg border-2 transition-all"
              :class="theme === opt.value ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'"
            >
              <div class="text-2xl mb-2">{{ opt.icon }}</div>
              <div class="font-medium text-zinc-900 dark:text-white">{{ opt.label }}</div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ opt.description }}</div>
            </div>
          </label>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'font'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Font Size</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Adjust the font size for better readability</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              UI Font Size: {{ fontSize.ui }}px
            </label>
            <input type="range" min="12" max="18" v-model="fontSize.ui" class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Code Font Size: {{ fontSize.code }}px
            </label>
            <input type="range" min="10" max="20" v-model="fontSize.code" class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Editor Font Size: {{ fontSize.editor }}px
            </label>
            <input type="range" min="10" max="24" v-model="fontSize.editor" class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer">
          </div>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'layout'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Layout</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Customize the application layout</p>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-zinc-900 dark:text-white">Show Sidebar</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">Display the left sidebar panel</div>
            </div>
            <button 
              class="w-12 h-6 rounded-full transition-colors"
              :class="layout.showSidebar ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'"
              @click="layout.showSidebar = !layout.showSidebar"
            >
              <div 
                class="w-5 h-5 bg-white rounded-full shadow transform transition-transform"
                :class="layout.showSidebar ? 'translate-x-6' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-zinc-900 dark:text-white">Compact Mode</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">Reduce spacing for more content</div>
            </div>
            <button 
              class="w-12 h-6 rounded-full transition-colors"
              :class="layout.compactMode ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'"
              @click="layout.compactMode = !layout.compactMode"
            >
              <div 
                class="w-5 h-5 bg-white rounded-full shadow transform transition-transform"
                :class="layout.compactMode ? 'translate-x-6' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-zinc-900 dark:text-white">Auto_save Requests</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">Automatically save request changes</div>
            </div>
            <button 
              class="w-12 h-6 rounded-full transition-colors"
              :class="layout.autoSave ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'"
              @click="layout.autoSave = !layout.autoSave"
            >
              <div 
                class="w-5 h-5 bg-white rounded-full shadow transform transition-transform"
                :class="layout.autoSave ? 'translate-x-6' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'network'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Network</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Configure network settings</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Request Timeout (ms)</label>
            <input 
              type="number" 
              v-model="network.timeout" 
              class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
              placeholder="30000"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Max Response Size (MB)</label>
            <input 
              type="number" 
              v-model="network.maxResponseSize" 
              class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
              placeholder="50"
            >
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" v-model="network.followRedirects" id="followRedirects" class="w-4 h-4 rounded">
            <label for="followRedirects" class="text-sm text-zinc-700 dark:text-zinc-300">Follow HTTP redirects</label>
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" v-model="network.sslVerification" id="sslVerification" class="w-4 h-4 rounded">
            <label for="sslVerification" class="text-sm text-zinc-700 dark:text-zinc-300">Enable SSL certificate verification</label>
          </div>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'certificate'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Certificates</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Manage SSL certificates</p>
        
        <div class="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-8 text-center">
          <div class="text-4xl mb-3">📜</div>
          <div class="text-zinc-500 dark:text-zinc-400 mb-2">No certificates configured</div>
          <button class="text-blue-500 hover:text-blue-600 text-sm font-medium">Add Certificate</button>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'proxy'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Proxy</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Configure proxy settings</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Proxy URL</label>
            <input 
              type="text" 
              v-model="proxy.url" 
              class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
              placeholder="http://proxy.example.com:8080"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Username</label>
            <input 
              type="text" 
              v-model="proxy.username" 
              class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
            <input 
              type="password" 
              v-model="proxy.password" 
              class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
            >
          </div>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'variables'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Variables</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Configure global variables</p>
        
        <div class="space-y-3 mb-4">
          <div v-for="(v, i) in variables" :key="i" class="flex gap-2">
            <input 
              v-model="v.key" 
              placeholder="Key"
              class="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm"
            >
            <input 
              v-model="v.value" 
              placeholder="Value"
              class="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm"
            >
            <button @click="variables.splice(i, 1)" class="text-red-500 hover:text-red-600 p-2">×</button>
          </div>
        </div>
        <button @click="variables.push({ key: '', value: '' })" class="text-blue-500 hover:text-blue-600 text-sm font-medium">+ Add Variable</button>
      </div>
      
      <div v-else-if="activeSection === 'shortcuts'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Keyboard Shortcuts</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">View and customize keyboard shortcuts</p>
        
        <div class="space-y-3">
          <div v-for="s in shortcuts" :key="s.action" class="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-700 dark:text-zinc-300">{{ s.action }}</span>
            <kbd class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm font-mono text-zinc-600 dark:text-zinc-400">{{ s.keys }}</kbd>
          </div>
        </div>
      </div>
      
      <div v-else-if="activeSection === 'about'" class="max-w-xl">
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">About</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Application information</p>
        
        <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6 text-center">
          <div class="text-5xl mb-4">🌩️</div>
          <h4 class="text-xl font-bold text-zinc-900 dark:text-white mb-1">Hailstorm</h4>
          <div class="text-zinc-500 dark:text-zinc-400 mb-4">Version 1.0.0</div>
          <div class="text-sm text-zinc-400 dark:text-zinc-500">
            A powerful API client built with Vue.js and Electron
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const activeSection = ref('theme');

const uiItems = [
  { id: 'theme', label: 'Theme' },
  { id: 'font', label: 'Font Size' },
  { id: 'layout', label: 'Layout' },
];

const appItems = [
  { id: 'network', label: 'Network' },
  { id: 'certificate', label: 'Certificates' },
  { id: 'proxy', label: 'Proxy' },
  { id: 'variables', label: 'Variables' },
];

const advancedItems = [
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'about', label: 'About' },
];

const theme = ref<'light' | 'dark' | 'system'>('dark');

const themeOptions = [
  { value: 'light', label: 'Light', description: 'Clean light theme', icon: '☀️' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: '🌙' },
  { value: 'system', label: 'System', description: 'Follow OS setting', icon: '💻' },
];

const fontSize = ref({ ui: 14, code: 13, editor: 14 });

const layout = ref({ showSidebar: true, compactMode: false, autoSave: true });

const network = ref({ timeout: 30000, maxResponseSize: 50, followRedirects: true, sslVerification: true });

const proxy = ref({ url: '', username: '', password: '' });

const variables = ref([{ key: '', value: '' }]);

const shortcuts = [
  { action: 'Send Request', keys: 'Ctrl + Enter' },
  { action: 'New Tab', keys: 'Ctrl + T' },
  { action: 'Close Tab', keys: 'Ctrl + W' },
  { action: 'Save Request', keys: 'Ctrl + S' },
  { action: 'Toggle Sidebar', keys: 'Ctrl + B' },
  { action: 'Search', keys: 'Ctrl + F' },
];

function applyTheme() {
  localStorage.setItem('hailstorm_theme', theme.value);
  if (theme.value === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
  }
}

onMounted(() => {
  const saved = localStorage.getItem('hailstorm_theme') as 'light' | 'dark' | 'system' | null;
  if (saved) theme.value = saved;
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') applyTheme();
  });
});
</script>