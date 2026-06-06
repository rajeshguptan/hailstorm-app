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

<!-- Sidebar + main content layout -->
<div v-else-if="showSidebarMain" class="flex-1 flex">
  <!-- Sidebar -->
  <div class="sidebar-main relative flex flex-col overflow-hidden" :style="{ width: uiStore.sidebarWidth + 'px' }">
    <div class="sidebar-resize-handle absolute right-0 top-0 h-full w-[0.1rem] bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-400 cursor-col-resize" @mousedown="startResize"></div>
    <div class="sidebar-header p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between">
      <h5 class="mb-0 text-zinc-900 dark:text-white">{{ sidebarTitle }}</h5>
    </div>
    <div class="sidebar-content p-2 flex flex-col bg-zinc-50 dark:bg-zinc-900" style="height: calc(100vh - 50px); overflow-y: auto;">
      <RouterView />
    </div>
  </div>
  
<!-- Main content area -->
   <div class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
     <!-- Request interface for collections and history -->
     <div v-if="showRequestDetail" class="flex flex-col flex-1 min-h-0">
       <div :style="{ height: uiStore.requestPanelHeight + 'px', flexShrink: 0 }">
         <RequestPanel />
       </div>
       <div class="panel-resize-handle w-full h-[0.1rem] bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-400 cursor-row-resize" @mousedown="startPanelResize"></div>
       <ResponsePanel class="flex-1 min-h-0" />
     </div>
     <!-- Secrets detail when selected -->
    <SecretsDetail v-if="uiStore.activeSidebar === 'secrets' && appStore.selectedSecretId !== null" />

    <EnvironmentsDetail v-if="uiStore.activeSidebar === 'environments' && environmentsStore.activeEnvironmentId !== null" />

    <CollectionPanel v-if="uiStore.activeSidebar === 'collections' && collectionsStore.selectedCollectionId !== null && requestsStore.selectedRequestId === null" />

       <UtilityContent v-if="uiStore.activeSidebar === 'utilities' && utilitiesStore.selectedUtilityId !== null" />
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
            class="px-2 py-1 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 truncate"
            :title="request.name"
          >
            <span class="font-mono text-blue-600 dark:text-blue-400">{{ request.method }}</span>
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

</div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { SidebarView } from '../types';
import { useAppStore } from '../stores';
import { useUIStore } from '../stores/ui';
import { useRequestsStore } from '../stores/requests';
import { useEnvironmentsStore } from '../stores/environments';
import { useUtilitiesStore } from '../stores/utilities';
import { useCollectionsStore } from '../stores/collections';
import { useRunnerStore } from '../stores/runner';
import { useSecretsStore } from '../stores/secrets';
import { useHistoryStore } from '../stores/history';
import ContextMenu from '../components/ContextMenu.vue';
import EnvModal from '../components/EnvModal.vue';
import RenameModal from '../components/RenameModal.vue';
import SecretsEncryptionModal from '../components/SecretsEncryptionModal.vue';
import TabsBar from '../components/TabsBar.vue';
import RequestPanel from '../components/RequestPanel.vue';
import ResponsePanel from '../components/ResponsePanel.vue';
import SettingsContent from '../components/SettingsContent.vue';
import SecretsDetail from '../components/SecretsDetail.vue';
import EnvironmentsDetail from '../components/EnvironmentsDetail.vue';
import CollectionPanel from '../components/CollectionPanel.vue';
import UtilityContent from '../components/UtilityContent.vue';
import RunnerPanel from '../components/RunnerPanel.vue';
import StatsPanel from '../components/StatsPanel.vue';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const uiStore = useUIStore();
const requestsStore = useRequestsStore();
const environmentsStore = useEnvironmentsStore();
const utilitiesStore = useUtilitiesStore();
const collectionsStore = useCollectionsStore();
const runnerStore = useRunnerStore();
const secretsStore = useSecretsStore();
const historyStore = useHistoryStore();

// Get the N most recent requests from history
const recentRequests = computed(() => {
  return historyStore.history.slice(0, uiStore.recentRequestCount).map(item => ({
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
    testScript: item.request.testScript
  }));
});

// Load a recent request into the current request panel
function loadRecentRequest(request: any) {
  if (!request) return;
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
      '/environments': 'environments',
      '/history': 'history',
      '/secrets': 'secrets',
      '/stats': 'stats',
      '/utilities': 'utilities',
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
  { id: 'environments' as SidebarView, icon: '🌍', label: 'Environments', route: '/environments' },
  { id: 'history' as SidebarView, icon: '🕒', label: 'History', route: '/history' },
  { id: 'secrets' as SidebarView, icon: secretsStore.isLocked ? '🔒' : '🔓', iconStyle: secretsStore.isLocked ? 'filter: sepia(1) hue-rotate(0deg) saturate(2) brightness(1.3)' : 'filter: sepia(1) hue-rotate(120deg) saturate(2) brightness(1.3)', label: 'Secrets', route: '/secrets' },
  { id: 'stats' as SidebarView, icon: '📊', label: 'Stats', route: '/stats' },
  { id: 'utilities' as SidebarView, icon: '🔧', label: 'Utilities', route: '/utilities' },
  { id: 'runner' as SidebarView, icon: '🏃', label: 'Runner', route: '/runner' },
  { id: 'settings' as SidebarView, icon: '⚙️', label: 'Settings', route: '/settings' },
]);

const sidebarPanels: SidebarView[] = ['collections', 'environments', 'history', 'secrets', 'utilities', 'runner'];

const showSidebarMain = computed(() => {
  return sidebarPanels.includes(uiStore.activeSidebar);
});

const showRequestDetail = computed(() => {
  const shouldShow = (uiStore.activeSidebar === 'collections' || uiStore.activeSidebar === 'history') && requestsStore.selectedRequestId !== null;
  console.log('showRequestDetail computed:', shouldShow, 'activeSidebar:', uiStore.activeSidebar, 'selectedRequestId:', requestsStore.selectedRequestId);
  console.log('showRequestDetail - collections check:', uiStore.activeSidebar === 'collections', 'history check:', uiStore.activeSidebar === 'history', 'selectedRequestId check:', requestsStore.selectedRequestId !== null);
  return shouldShow;
});

const sidebarTitle = computed(() => {
  return uiStore.sidebarTitle;
});

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
    router.push(`/${id}`).catch(err => {
      console.error('Router navigation error:', err);
    });

    // Clear selections when navigating to different views
    if (id === 'collections') {
      requestsStore.selectRequest(null); // This will reset to default request
    } else if (id === 'environments') {
      environmentsStore.activeEnvironmentId = null;
    } else if (id === 'secrets') {
      console.log('[DEBUG] navigate to secrets, setting selectedSecretId to null');
      appStore.selectedSecretId = null;
    } else if (id === 'utilities') {
      utilitiesStore.selectedUtilityId = utilitiesStore.utilities.length > 0 ? utilitiesStore.utilities[0].id : null;
    } else if (id === 'runner') {
      // Sidebar title is set in watch(route)
    }

    router.push(item.route);
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
</style>
