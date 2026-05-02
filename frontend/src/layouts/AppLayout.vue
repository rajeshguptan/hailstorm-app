<template>
  <div class="hailstorm-app flex h-screen w-screen">
    <div class="ribbon-bar bg-zinc-200 dark:bg-zinc-800 flex flex-col py-1 flex-shrink-0" style="width: 80px;">
      <div class="ribbon-item relative" v-for="item in ribbonItems" :key="item.id">
        <button 
          class="ribbon-btn py-2 px-2 text-zinc-800 dark:text-white flex flex-col items-center justify-center w-full gap-1" 
          :class="{ 'bg-zinc-300 dark:bg-zinc-700': isActive(item.id) }" 
          @click="navigate(item.id)"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-xs">{{ item.label }}</span>
        </button>
        <div class="separator" v-if="item.id !== 'settings'"></div>
      </div>
    </div>
    
<main class="flex-1 flex">
<!-- Settings view (full width) -->
  <div v-if="uiStore.activeSidebar === 'settings'" class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
  <SettingsContent />
</div>

<!-- Sidebar + main content layout -->
<div v-else-if="showSidebarMain" class="flex-1 flex">
  <!-- Sidebar -->
  <div class="sidebar-main flex flex-col overflow-hidden" style="width: 280px;">
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
    <div v-if="showRequestDetail" class="flex flex-col h-full">
      <RequestPanel />
      <ResponsePanel />
    </div>
    <!-- Secrets detail when selected -->
    <SecretsDetail v-if="uiStore.activeSidebar === 'secrets' && appStore.selectedSecretId !== null" />

    <EnvironmentsDetail v-if="uiStore.activeSidebar === 'environments' && environmentsStore.activeEnvironmentId !== null" />

    <CollectionPanel v-if="uiStore.activeSidebar === 'collections' && appStore.selectedCollectionId !== null && requestsStore.selectedRequestId === null" />

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
     <!-- Other main content can go here -->
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

</div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { SidebarView } from '../types';
import { useAppStore } from '../stores';
import { useUIStore } from '../stores/ui';
import { useRequestsStore } from '../stores/requests';
import { useEnvironmentsStore } from '../stores/environments';
import { useUtilitiesStore } from '../stores/utilities';
import { useCollectionsStore } from '../stores/collections';
import { useRunnerStore } from '../stores/runner';
import ContextMenu from '../components/ContextMenu.vue';
import EnvModal from '../components/EnvModal.vue';
import RenameModal from '../components/RenameModal.vue';
import TabsBar from '../components/TabsBar.vue';
import RequestPanel from '../components/RequestPanel.vue';
import ResponsePanel from '../components/ResponsePanel.vue';
import SettingsContent from '../components/SettingsContent.vue';
import SecretsDetail from '../components/SecretsDetail.vue';
import EnvironmentsDetail from '../components/EnvironmentsDetail.vue';
import CollectionPanel from '../components/CollectionPanel.vue';
import UtilityContent from '../components/UtilityContent.vue';
import RunnerPanel from '../components/RunnerPanel.vue';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const uiStore = useUIStore();
const requestsStore = useRequestsStore();
const environmentsStore = useEnvironmentsStore();
const utilitiesStore = useUtilitiesStore();
const collectionsStore = useCollectionsStore();
const runnerStore = useRunnerStore();

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

const ribbonItems = [
  { id: 'collections' as SidebarView, icon: '📁', label: 'Collections', route: '/collections' },
  { id: 'environments' as SidebarView, icon: '🌍', label: 'Environments', route: '/environments' },
  { id: 'history' as SidebarView, icon: '🕒', label: 'History', route: '/history' },
  { id: 'secrets' as SidebarView, icon: '🔐', label: 'Secrets', route: '/secrets' },
  { id: 'stats' as SidebarView, icon: '📊', label: 'Stats', route: '/stats' },
  { id: 'utilities' as SidebarView, icon: '🔧', label: 'Utilities', route: '/utilities' },
  { id: 'runner' as SidebarView, icon: '🏃', label: 'Runner', route: '/runner' },
  { id: 'settings' as SidebarView, icon: '⚙️', label: 'Settings', route: '/settings' },
];

const sidebarPanels: SidebarView[] = ['collections', 'environments', 'history', 'secrets', 'utilities', 'runner', 'settings'];

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

function isActive(id: string): boolean {
  return uiStore.activeSidebar === id;
}

function navigate(id: SidebarView) {
  const item = ribbonItems.find(i => i.id === id);
  if (item) {
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
