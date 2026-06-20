<template>
  <div class="hailstorm-app flex h-screen w-screen">
    <div class="ribbon-bar bg-zinc-200 dark:bg-zinc-800 flex flex-col py-1 flex-shrink-0" style="width: 80px;">
      <div class="ribbon-item relative" v-for="item in ribbonItems" :key="item.id">
        <button 
          class="ribbon-btn py-2 px-2 text-zinc-800 dark:text-white flex flex-col items-center justify-center w-full gap-1" 
          :class="{ 'bg-zinc-300 dark:bg-zinc-700': isActive(item.id) }" 
          @click="navigate(item.id)"
        >
          <span class="text-xl" :style="item.iconStyle">{{ item.icon }}</span>
          <span class="text-xs">{{ item.label }}</span>
        </button>
        <div class="separator" v-if="item.id !== 'settings'"></div>
      </div>
    </div>
    
 <main class="flex-1 flex">
<!-- Full width views -->
<div v-if="uiStore.activeSidebar === 'settings'" class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
   <SettingsContent />
 </div>
 <div v-else-if="uiStore.activeSidebar === 'stats'" class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
   <StatsPanel />
 </div>
 <div v-else-if="uiStore.activeSidebar === 'console'" class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
   <ConsolePanel />
 </div>

<!-- Sidebar + main content layout -->
<div v-else-if="showSidebarMain" class="flex-1 flex">
  <!-- Sidebar -->
  <div class="sidebar-main relative flex flex-col overflow-hidden" :style="{ width: uiStore.sidebarWidth + 'px' }">
    <div class="sidebar-resize-handle absolute right-0 top-0 h-full w-[0.1rem] bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-400 cursor-col-resize" @mousedown="startResize"></div>
    <div class="sidebar-header p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between">
      <h5 class="mb-0 text-zinc-900 dark:text-white">{{ sidebarTitle }}</h5>
      <div v-if="uiStore.activeSidebar === 'collections'" class="flex items-center gap-2">
        <span class="text-sm text-zinc-600 dark:text-zinc-400">Env :</span>
        <select :value="activeEnvironmentId || ''" @change="handleEnvironmentChange" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm w-32">
          <option value=""></option>
          <option :value="NEW_ENVIRONMENT_OPTION" class="text-blue-600">New Env</option>
          <option v-for="env in environments" :key="env.id" :value="env.id">{{ env.name }}</option>
        </select>
      </div>
    </div>
    <div class="sidebar-content p-2 flex flex-col bg-zinc-50 dark:bg-zinc-900" style="height: calc(100vh - 50px); overflow-y: auto;">
      <RouterView />
    </div>
  </div>
  
<!-- Main content area -->
   <div class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
<!-- Request interface for collections and history -->
      <div v-if="showRequestDetail" class="flex flex-col flex-1 min-h-0">
        <div v-if="requestsStore.currentRequest?.method === 'SHELL'" class="flex-1 min-h-0">
          <ShellScriptDetail />
        </div>
        <div v-else :style="{ height: uiStore.requestPanelHeight + 'px', flexShrink: 0 }">
          <RequestPanel />
        </div>
        <div v-if="requestsStore.currentRequest?.method !== 'SHELL'" class="panel-resize-handle w-full h-[0.1rem] bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-400 cursor-row-resize" @mousedown="startPanelResize"></div>
        <ResponsePanel v-if="requestsStore.currentRequest?.method !== 'SHELL'" class="flex-1 min-h-0" />
      </div>
     <!-- Secrets detail when selected -->
    <SecretsDetail v-if="uiStore.activeSidebar === 'secrets' && appStore.selectedSecretId !== null" />

    <CollectionPanel v-if="uiStore.activeSidebar === 'collections' && collectionsStore.selectedCollectionId !== null && requestsStore.selectedRequestId === null" />
     <!-- Runner panel -->
    <RunnerPanel
      v-if="uiStore.activeSidebar === 'runner'"
      :collections="collectionsStore.collections"
      :environments="environmentsStore.environments"
      :activeEnvironmentId="environmentsStore.activeEnvironmentId"
      :runConfigs="runnerStore.runConfigs"
      :selectedConfigId="runnerStore.selectedConfigId"
      @update-run-config="runnerStore.updateRunConfig"
    />
<!-- Recent Requests Tabs at Bottom (only visible in Collections) -->
     <div v-if="uiStore.activeSidebar === 'collections'" class="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex-shrink-0">
       <div class="px-3 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
         <div class="flex gap-1">
           <button
             v-for="request in recentRequests"
             :key="request.historyId"
             @click="loadRecentRequest(request)"
             class="px-2 py-1 text-xs border rounded truncate transition-colors relative"
             :style="request.backgroundColorStyle"
             :title="request.name"
           >
             <span class="font-mono">{{ request.method }}</span>
             <span class="ml-1">{{ request.name }}</span>
           </button>
           <span v-if="recentRequests.length === 0" class="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">No recent requests</span>
         </div>
       </div>
     </div>
  </div>
</div>

<!-- Full screen views for when sidebar is collapsed -->
<div v-else>
  <div class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
    <RouterView />
  </div>
</div>
  </main>

  <!-- Context Menu -->
  <ContextMenu />

  <!-- Rename Modal -->
  <RenameModal />

  <!-- Secrets Encryption Modal -->
  <SecretsEncryptionModal
    :show="secretsStore.showEncryptionModal"
    @submit="handleEncryptionKeySubmit"
    @close="secretsStore.hideUnlockModal()"
  />

  <div v-if="showNewEnvironmentModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="showNewEnvironmentModal = false">
    <div class="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded p-4" style="width: 350px;" @click.stop>
      <h5 class="mb-3">New Env</h5>
      <input
        v-model="newEnvironmentName"
        type="text"
        class="form-input bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded mb-3 w-full px-3 py-2"
        placeholder="Environment name"
        @keydown.enter="createNewEnvironment"
      />
      <div class="flex gap-2 justify-end">
        <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700" @click="showNewEnvironmentModal = false">Cancel</button>
        <button class="btn btn-sm bg-blue-500 text-white hover:bg-blue-600" @click="createNewEnvironment">Create</button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { SidebarView } from '../types';
import { useAppStore } from '../stores';
import { useUIStore } from '../stores/ui';
import { useRequestsStore } from '../stores/requests';
import { useEnvironmentsStore } from '../stores/environments';
import { useCollectionsStore } from '../stores/collections';
import { useRunnerStore } from '../stores/runner';
import { useSecretsStore } from '../stores/secrets';
import { useHistoryStore } from '../stores/history';
import ContextMenu from '../components/ContextMenu.vue';
import RenameModal from '../components/RenameModal.vue';
import SecretsEncryptionModal from '../components/SecretsEncryptionModal.vue';
import TabsBar from '../components/TabsBar.vue';
import RequestPanel from '../components/RequestPanel.vue';
import ResponsePanel from '../components/ResponsePanel.vue';
import SettingsContent from '../components/SettingsContent.vue';
import SecretsDetail from '../components/SecretsDetail.vue';
import CollectionPanel from '../components/CollectionPanel.vue';
import ShellScriptDetail from '../components/ShellScriptDetail.vue';
import RunnerPanel from '../components/RunnerPanel.vue';
import StatsPanel from '../components/StatsPanel.vue';
import ConsolePanel from '../components/ConsolePanel.vue';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const uiStore = useUIStore();
const requestsStore = useRequestsStore();
const environmentsStore = useEnvironmentsStore();
const collectionsStore = useCollectionsStore();
const runnerStore = useRunnerStore();
const secretsStore = useSecretsStore();
const historyStore = useHistoryStore();

// Get the N most recent requests from history
const recentRequests = computed(() => {
  return historyStore.history.slice(0, uiStore.recentRequestCount).map((item, index) => {
    const total = Math.max(1, Math.min(uiStore.recentRequestCount, historyStore.history.length));
    const position = index + 1;
    // MRU (most recent, first in list, index=0) = darkest (alpha 0.5)
    // LRU (least recent, last in list) = lightest (alpha 0.15)
    const ratio = (total - position) / Math.max(1, total - 1);
    const alpha = 0.15 + ratio * 0.35;
    const borderColorAlpha = 0.25 + ratio * 0.6;
    
    const isModified = item.modified === true;
    // Modified requests get reddish shade with same alpha
    const bgColor = isModified ? `rgba(239, 68, 68, ${alpha})` : `rgba(34, 197, 94, ${alpha})`;
    const borderColor = isModified ? `rgba(239, 68, 68, ${borderColorAlpha})` : `rgba(34, 197, 94, ${borderColorAlpha})`;
    
    return {
      historyId: item.id,
      id: item.request.id,
      name: item.request.name || item.request.url,
      method: item.request.method,
      url: item.request.url,
      headers: item.request.headers,
      body: item.request.body,
      auth: item.request.auth,
      variables: item.request.variables,
      preRequestScript: item.request.preRequestScript,
      postRequestScript: item.request.postRequestScript,
      testScript: item.request.testScript,
      timestamp: item.timestamp,
      position,
      total,
      modified: isModified,
      backgroundColorStyle: {
        backgroundColor: bgColor,
        borderColor: borderColor
      }
    };
  });
});

// Load a recent request into the current request panel
function loadRecentRequest(request: any) {
  if (!request) return;
  if (uiStore && uiStore.clearRequestModified) {
    uiStore.clearRequestModified();
  } else {
    uiStore.requestModified = false;
  }
  const reqId = request.id || requestsStore.generateId('req');
  requestsStore.currentRequest = {
    ...request,
    id: reqId
  };
  requestsStore.selectedRequestId = reqId;
  requestsStore.urlParams = requestsStore.extractParams(request.url || '');
  requestsStore.requestHeaders = request.headers ? [...request.headers] : [];
  requestsStore.activeRequestTab = 'params';
}

// Sync activeSidebar with route when navigation happens (not via ribbon click)
watch(
  () => route.path,
  (to) => {
    // Map route paths to sidebar IDs
    const routeToSidebar: Record<string, SidebarView> = {
      '/collections': 'collections',
      '/history': 'history',
      '/secrets': 'secrets',
      '/stats': 'stats',
      '/runner': 'runner',
      '/settings': 'settings'
    };

    const sidebarId = routeToSidebar[to];
    if (sidebarId && uiStore.activeSidebar !== sidebarId) {
      uiStore.activeSidebar = sidebarId;
      if (sidebarId === 'runner') {
        uiStore.sidebarTitle = 'Run Configs';
      } else {
        uiStore.sidebarTitle = sidebarId.charAt(0).toUpperCase() + sidebarId.slice(1);
      }
    }
  }
);

const ribbonItems = computed(() => [
  { id: 'collections' as SidebarView, icon: '📁', label: 'Collections', route: '/collections' },
  { id: 'history' as SidebarView, icon: '🕒', label: 'History', route: '/history' },
  { id: 'secrets' as SidebarView, icon: secretsStore.isLocked ? '🔒' : '🔓', iconStyle: secretsStore.isLocked ? 'filter: sepia(1) hue-rotate(0deg) saturate(2) brightness(1.3)' : 'filter: sepia(1) hue-rotate(120deg) saturate(2) brightness(1.3)', label: 'Secrets', route: '/secrets' },
  { id: 'stats' as SidebarView, icon: '📊', label: 'Stats', route: '/stats' },
  { id: 'runner' as SidebarView, icon: '🏃', label: 'Runner', route: '/runner' },
  { id: 'console' as SidebarView, icon: '🖥️', label: 'Console', route: '/console' },
  { id: 'settings' as SidebarView, icon: '⚙️', label: 'Settings', route: '/settings' },
]);

const sidebarPanels: SidebarView[] = ['collections', 'history', 'secrets', 'runner'];

const showSidebarMain = computed(() => {
  return sidebarPanels.includes(uiStore.activeSidebar);
});

const showRequestDetail = computed(() => {
  return (uiStore.activeSidebar === 'collections' || uiStore.activeSidebar === 'history') && requestsStore.selectedRequestId !== null;
});

const sidebarTitle = computed(() => {
  return uiStore.sidebarTitle;
});

const activeEnvironmentId = computed(() => environmentsStore.activeEnvironmentId);
const environments = computed(() => environmentsStore.environments);
const NEW_ENVIRONMENT_OPTION = '__new_environment__';
const showNewEnvironmentModal = ref(false);
const newEnvironmentName = ref('');

function handleEnvironmentChange(event: Event) {
  const selectedEnvironmentId = (event.target as HTMLSelectElement).value;
  if (selectedEnvironmentId === NEW_ENVIRONMENT_OPTION) {
    newEnvironmentName.value = '';
    showNewEnvironmentModal.value = true;
    return;
  }

  environmentsStore.selectEnvironment(selectedEnvironmentId || null);
}

function createNewEnvironment() {
  const name = newEnvironmentName.value.trim();
  if (!name) return;

  environmentsStore.addEnvironment(name);
  newEnvironmentName.value = '';
  showNewEnvironmentModal.value = false;
}

let resizeStartX = 0;
let resizeStartWidth = 0;

function startResize(e: MouseEvent) {
  resizeStartX = e.clientX;
  resizeStartWidth = uiStore.sidebarWidth;
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
}

function doResize(e: MouseEvent) {
  const deltaX = e.clientX - resizeStartX;
  const newWidth = resizeStartWidth + deltaX;
  uiStore.sidebarWidth = Math.max(200, Math.min(600, newWidth));
  localStorage.setItem('sidebarWidth', uiStore.sidebarWidth.toString());
}

function stopResize() {
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
}

let panelResizeStartY = 0;
let panelResizeStartHeight = 0;

function startPanelResize(e: MouseEvent) {
  panelResizeStartY = e.clientY;
  panelResizeStartHeight = uiStore.requestPanelHeight;
  document.addEventListener('mousemove', doPanelResize);
  document.addEventListener('mouseup', stopPanelResize);
}

function doPanelResize(e: MouseEvent) {
  const deltaY = e.clientY - panelResizeStartY;
  const newHeight = panelResizeStartHeight + deltaY;
  uiStore.setRequestPanelHeight(newHeight);
}

function stopPanelResize() {
  document.removeEventListener('mousemove', doPanelResize);
  document.removeEventListener('mouseup', stopPanelResize);
}

function isActive(id: string): boolean {
  return uiStore.activeSidebar === id;
}

function handleEncryptionKeySubmit(key: string) {
  const hasEverSetUp = !!localStorage.getItem('hailstorm_encryption_key');

  if (!hasEverSetUp) {
    // First time setup - store the key
    localStorage.setItem('hailstorm_encryption_key', key);
  }

  // Always unlock for this session
  secretsStore.setEncryptionKey(key);

  // Navigate to secrets after unlocking
  navigate('secrets');
}

// Secrets store initializes itself when the module loads

function navigate(id: SidebarView) {
  const item = ribbonItems.value.find(i => i.id === id);
  if (item) {
    // Special handling for secrets - check if unlocked
    if (id === 'secrets' && secretsStore.isLocked) {
      secretsStore.showUnlockModal();
      return; // Don't navigate if locked
    }

    uiStore.activeSidebar = id;
    if (id === 'runner') {
      uiStore.sidebarTitle = 'Run Configs';
    } else {
      uiStore.sidebarTitle = id.charAt(0).toUpperCase() + id.slice(1);
    }

    // Navigate to the corresponding route
    router.push(item.route).catch(err => {
      console.error('Router navigation error:', err);
    });

    // Clear selections when navigating to different views
    if (id === 'collections') {
      requestsStore.selectRequest(null); // This will reset to default request
    } else if (id === 'secrets') {
      appStore.selectedSecretId = null;
    }
  }
}
</script>

<style scoped>
.ribbon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.ribbon-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.dark .ribbon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.separator {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 2px 8px;
}

.dark .separator {
  background: rgba(255, 255, 255, 0.2);
}

.ribbon-item {
  position: relative;
}

/* Recent request tabs gradient colors */
.recent-tab-modified {
  background-color: rgba(251, 146, 60, 0.3);
  border-color: rgba(251, 146, 60, 0.5);
}

.dark .recent-tab-modified {
  background-color: rgba(253, 186, 116, 0.3);
  border-color: rgba(251, 146, 60, 0.5);
}
</style>
