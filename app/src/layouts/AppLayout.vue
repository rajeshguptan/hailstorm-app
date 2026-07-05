<template>
  <div class="hailstorm-app flex h-screen w-screen" @click="sideListMenuOpen = false">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="ribbon-bar bg-zinc-200 dark:bg-zinc-800 flex flex-col py-1 flex-shrink-0" style="width: 80px;" role="navigation" aria-label="Main navigation">
      <div class="ribbon-item relative" v-for="item in ribbonItems" :key="item.id">
        <button 
          class="ribbon-btn py-2 px-2 text-zinc-800 dark:text-white flex flex-col items-center justify-center w-full gap-1" 
          :class="{ 'bg-zinc-300 dark:bg-zinc-700': isActive(item.id) }" 
          @click="navigate(item.id)"
          :aria-current="isActive(item.id) ? 'page' : null"
          :aria-label="item.label"
        >
          <span class="text-2xl leading-none" :style="item.iconStyle">{{ item.icon }}</span>
          <span class="text-xs">{{ item.label }}</span>
        </button>
        <div class="separator" v-if="item.id !== 'settings' && item.id !== 'feedback'"></div>
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
 <div v-else-if="uiStore.activeSidebar === 'docs'" class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
   <DocsPanel />
 </div>
 <div v-else-if="uiStore.activeSidebar === 'feedback'" class="main-content flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
   <FeedbackPanel />
 </div>

<!-- Sidebar + main content layout -->
<div v-else-if="showSidebarMain" class="flex-1 flex">
  <!-- Sidebar -->
  <div class="sidebar-main relative flex flex-col overflow-hidden" :style="{ width: uiStore.sidebarWidth + 'px' }">
    <div class="sidebar-resize-handle absolute right-0 top-0 h-full w-[0.1rem] bg-zinc-300 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-400 cursor-col-resize" @mousedown="startResize"></div>
    <div class="sidebar-header p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center gap-2 group">
      <div class="flex items-center gap-2 min-w-0">
        <h5 class="mb-0 text-zinc-900 dark:text-white whitespace-nowrap">{{ sidebarTitle }}</h5>
        <div v-if="uiStore.activeSidebar === 'collections'" class="relative">
          <button
            class="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-lg leading-none px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
            :class="{ 'opacity-100 bg-zinc-200 dark:bg-zinc-800': sideListMenuOpen }"
            title="Side list options"
            aria-label="Side list options"
            @click.stop="toggleSideListMenu"
            @keydown.escape="sideListMenuOpen = false"
          >•••</button>
          <div v-if="sideListMenuOpen" class="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg z-20 min-w-[180px]" @click.stop>
            <template v-if="uiStore.activeSidebar === 'collections'">
              <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700" @click.stop="runSideListAction(() => collectionsStore.addCollection())">New Collection</button>
              <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700" @click.stop="runSideListAction(() => importCollection('postman'))">Import Postman Collection</button>
              <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700" @click.stop="runSideListAction(() => importCollection('openapi'))">Import OpenAPI Spec</button>
              <button class="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-700" @click.stop="runSideListAction(() => importCollection('test'))">Load Sample API</button>
            </template>
          </div>
        </div>
      </div>
      <div v-if="uiStore.activeSidebar === 'collections'" class="ml-auto">
        <select :value="activeEnvironmentId || ''" @change="handleEnvironmentChange" class="form-select bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm w-32">
          <option value=""></option>
          <option :value="NEW_ENVIRONMENT_OPTION" class="text-blue-600">New Env</option>
          <option v-for="env in environments" :key="env.id" :value="env.id">{{ env.name }}</option>
        </select>
      </div>
      <div v-else class="relative ml-auto">
        <button
          class="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-lg leading-none px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
          :class="{ 'opacity-100 bg-zinc-200 dark:bg-zinc-800': sideListMenuOpen }"
          title="Side list options"
          aria-label="Side list options"
          @click.stop="toggleSideListMenu"
          @keydown.escape="sideListMenuOpen = false"
        >•••</button>
        <div v-if="sideListMenuOpen" class="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg z-20 min-w-[180px]" @click.stop>
          <template v-if="uiStore.activeSidebar === 'history'">
            <button class="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="historyStore.history.length === 0" @click.stop="runSideListAction(() => clearHistory())">Clear History</button>
          </template>
          <template v-else-if="uiStore.activeSidebar === 'secrets'">
            <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!secretsStore.isUnlocked" @click.stop="runSideListAction(() => addSecret())">Add Secret</button>
            <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!secretsStore.isUnlocked" @click.stop="runSideListAction(() => importSecrets())">Import Secrets</button>
            <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!secretsStore.isUnlocked" @click.stop="runSideListAction(() => exportSecrets())">Export Secrets</button>
          </template>
          <template v-else-if="uiStore.activeSidebar === 'runner'">
            <button class="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700" @click.stop="runSideListAction(() => runnerStore.addRunConfig())">New Run Config</button>
          </template>
        </div>
      </div>
    </div>
    <div class="sidebar-content p-2 flex flex-col bg-zinc-50 dark:bg-zinc-900" style="height: calc(100vh - 50px); overflow-y: auto;">
      <RunConfigsPanel
        v-if="uiStore.activeSidebar === 'runner'"
        :runConfigs="runnerStore.runConfigs"
        :selectedConfigId="runnerStore.selectedConfigId"
        @add-run-config="runnerStore.addRunConfig"
        @select-config="runnerStore.selectRunConfig"
        @context-menu="uiStore.showContextMenu"
      />
      <RouterView v-else />
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
    <RunnerDetails
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
import { computed, watch, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { SidebarView, Variable } from '../types';
import { useAppStore } from '../stores';
import { useUIStore } from '../stores/ui';
import { useRequestsStore } from '../stores/requests';
import { useEnvironmentsStore } from '../stores/environments';
import { useCollectionsStore } from '../stores/collections';
import { useRunnerStore } from '../stores/runner';
import { useSecretsStore } from '../stores/secrets';
import { useHistoryStore } from '../stores/history';
import ContextMenu from '../components/base/ContextMenu.vue';
import RenameModal from '../components/base/RenameModal.vue';
import SecretsEncryptionModal from '../components/secrets/SecretsEncryptionModal.vue';
import RequestPanel from '../components/request/RequestPanel.vue';
import ResponsePanel from '../components/request/ResponsePanel.vue';
import SettingsContent from '../components/settings/SettingsContent.vue';
import SecretsDetail from '../components/secrets/SecretsDetail.vue';
import CollectionPanel from '../components/collection/CollectionPanel.vue';
import ShellScriptDetail from '../components/request/ShellScriptDetail.vue';
import StatsPanel from '../components/stats/StatsPanel.vue';
import ConsolePanel from '../components/console/ConsolePanel.vue';
import DocsPanel from '../components/docs/DocsPanel.vue';
import FeedbackPanel from '../components/feedback/FeedbackPanel.vue';
import RunConfigsPanel from '../components/runner/RunConfigsPanel.vue';
import RunnerDetails from '../components/runner/RunnerDetails.vue';

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
      '/settings': 'settings',
      '/docs': 'docs'
    };

    const sidebarId = routeToSidebar[to];
    if (sidebarId && uiStore.activeSidebar !== sidebarId) {
      uiStore.activeSidebar = sidebarId;
      sideListMenuOpen.value = false;
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
  { id: 'docs' as SidebarView, icon: '📚', label: 'Docs', route: '/docs' },
  { id: 'settings' as SidebarView, icon: '⚙️', label: 'Settings', route: '/settings' },
   { id: 'feedback' as SidebarView, icon: '💬', label: 'Feedback', route: '/feedback' },
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
const sideListMenuOpen = ref(false);

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

function toggleSideListMenu() {
  sideListMenuOpen.value = !sideListMenuOpen.value;
}

async function runSideListAction(action: () => Promise<void> | void) {
   await action();
   sideListMenuOpen.value = false;
 }

type CollectionImportType = 'postman' | 'openapi' | 'test';

async function importCollection(importType: CollectionImportType = 'postman') {
  if (importType === 'test') {
    const sampleSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Sample Pet Store API',
        version: '1.0.0',
        description: 'A sample API for testing pet store operations'
      },
      servers: [
        {
          url: 'https://api.petstore.com/v1',
          description: 'Production server'
        }
      ],
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            operationId: 'listPets',
            tags: ['pets'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                description: 'How many items to return at one time',
                required: false,
                schema: {
                  type: 'integer',
                  format: 'int32'
                },
                example: 10
              }
            ],
            responses: {
              '200': {
                description: 'A paged array of pets',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Pet'
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create a pet',
            operationId: 'createPet',
            tags: ['pets'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Pet'
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created pet',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pet'
                    }
                  }
                }
              }
            }
          }
        },
        '/pets/{petId}': {
          get: {
            summary: 'Get a pet by ID',
            operationId: 'getPetById',
            tags: ['pets'],
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                description: 'The id of the pet to retrieve',
                schema: {
                  type: 'string'
                },
                example: '12345'
              }
            ],
            responses: {
              '200': {
                description: 'Expected response to a valid request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pet'
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create a pet by ID',
            operationId: 'createPetById',
            tags: ['pets'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Pet'
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created pet',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pet'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Pet: {
            type: 'object',
            required: ['name'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
                example: 10
              },
              name: {
                type: 'string',
                example: 'Buddy'
              },
              category: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    format: 'int64',
                    example: 1
                  },
                  name: {
                    type: 'string',
                    example: 'Dogs'
                  }
                }
              },
              status: {
                type: 'string',
                description: 'pet status in the store',
                enum: ['available', 'pending', 'sold'],
                example: 'available'
              }
            }
          }
        }
      }
    };
    importOpenAPISpec(sampleSpec);
    return;
  }

  try {
    const acceptTypes = importType === 'openapi' ? '.json,.yaml,.yml' : '.json';

    if (!window.api) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptTypes;
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
if (importType === 'openapi') {
       await importOpenAPISpec(data);
     } else {
       await importCollectionData(data);
     }
        } catch (err) {
          console.error('Failed to import:', err);
        }
      };
      input.click();
      return;
    }

    const content = await window.api.importCollection();
    if (!content) return;
    const data = JSON.parse(content);
    if (importType === 'openapi') {
      await importOpenAPISpec(data);
    } else {
      await importCollectionData(data);
    }
  } catch (err) {
    console.error('Import error:', err);
  }
}

function convertPostmanHeaders(postmanHeaders: any): Variable[] {
  if (!Array.isArray(postmanHeaders)) return [];

  return postmanHeaders
    .filter((header: any) => header.key && header.value)
    .map((header: any) => ({
      key: header.key,
      value: header.value,
      enabled: !header.disabled && header.enabled !== false
    }));
}

function convertPostmanUrl(postmanUrl: any): string {
  if (typeof postmanUrl === 'string') return postmanUrl;

  if (typeof postmanUrl === 'object' && postmanUrl.raw) return postmanUrl.raw;

  if (Array.isArray(postmanUrl)) {
    return postmanUrl.map((part: any) => {
      if (typeof part === 'string') return part;
      if (part.value) return part.value;
      return '';
    }).join('');
  }

  return '';
}

function convertPostmanBody(postmanBody: any): { type: string; content: string } {
  if (!postmanBody || !postmanBody.mode) return { type: 'none', content: '' };

  switch (postmanBody.mode) {
    case 'raw':
      return { type: 'raw', content: postmanBody.raw || '' };
    case 'urlencoded':
      if (postmanBody.urlencoded && Array.isArray(postmanBody.urlencoded)) {
        const params = postmanBody.urlencoded
          .filter((param: any) => param.key && param.value)
          .map((param: any) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
          .join('&');
        return { type: 'urlencoded', content: params };
      }
      return { type: 'none', content: '' };
    case 'formdata':
      if (postmanBody.formdata && Array.isArray(postmanBody.formdata)) {
        return { type: 'formdata', content: JSON.stringify(postmanBody.formdata) };
      }
      return { type: 'none', content: '' };
    case 'file':
      return { type: 'file', content: JSON.stringify(postmanBody.file || {}) };
    case 'graphql':
      if (postmanBody.graphql) {
        return { type: 'graphql', content: JSON.stringify(postmanBody.graphql) };
      }
      return { type: 'none', content: '' };
    default:
      return { type: 'none', content: '' };
  }
}

function normalizeCollectionVariables(variables: any[] = []): any[] {
  return variables.map((variable: any) => ({
    key: variable.key || '',
    value: variable.value ?? variable.default ?? '',
    enabled: variable.enabled !== false,
    env: ''
  }));
}

async function importCollectionData(data: any) {
   if (!data) return;

   const processItems = (items: any[]): any[] => {
     return items.map((item: any) => {
       const newItem = { ...item };

       if (newItem.request && typeof newItem.request === 'object') {
         const requestData = newItem.request;
         newItem.method = requestData.method || 'GET';
         newItem.url = convertPostmanUrl(requestData.url) || '';
         newItem.headers = convertPostmanHeaders(requestData.header) || [];
         newItem.body = convertPostmanBody(requestData.body);
         newItem.auth = requestData.auth;
         newItem.preRequestScript = requestData.preRequestScript;
         newItem.testScript = requestData.testScript;
         newItem.variables = requestData.variables;
         newItem.flavors = requestData.flavors;
         delete newItem.request;
       }

       if (!newItem.id) {
         newItem.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
       }

       if (newItem.item && Array.isArray(newItem.item)) {
         newItem.items = processItems(newItem.item);
         delete newItem.item;
       }

       return newItem;
     });
   };
const processCollection = (c: any) => {
      const id = c.id || `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        ...c,
        id,
        items: processItems(c.items || []),
        variables: normalizeCollectionVariables(c.variables || c.variable || [])
      };
    };

    let workspaceLocation = '';
    try {
      const homeDir = await window.api.getHomeDirectory();
      workspaceLocation = homeDir ? `${homeDir}/hailstorm/` : '';
    } catch (err) {
      console.debug('Could not get home directory:', err);
    }

    if (data.collection) {
      const coll = processCollection(data.collection);
      coll.workspaceLocation = `${workspaceLocation}${coll.id}`;
      collectionsStore.collections.push(coll);
      collectionsStore.saveCollections();
    } else if (data.collections) {
      const processed = data.collections.map(processCollection);
      processed.forEach(coll => {
        coll.workspaceLocation = `${workspaceLocation}${coll.id}`;
      });
      collectionsStore.collections.push(...processed);
      collectionsStore.saveCollections();
    } else if (Array.isArray(data)) {
      const processed = data.map(processCollection);
      processed.forEach(coll => {
        coll.workspaceLocation = `${workspaceLocation}${coll.id}`;
      });
      collectionsStore.collections.push(...processed);
      collectionsStore.saveCollections();
    } else if (data.info && data.item) {
     const processedItems = processItems(data.item);
     const newId = `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
     collectionsStore.collections.push({
       id: newId,
       name: data.info.name || 'Imported Collection',
       items: processedItems,
       variables: normalizeCollectionVariables(data.variable || []),
       workspaceLocation: `${workspaceLocation}${newId}`
     });
     collectionsStore.saveCollections();
   }
 }

async function importOpenAPISpec(spec: any) {
   if (!spec || !spec.info) {
     console.error('Invalid OpenAPI spec - missing info');
     return;
   }

   const baseUrl = getBaseServerUrl(spec);
   const tagGroups: Record<string, any[]> = {};
   const untaggedRequests: any[] = [];

   for (const [path, pathItem] of Object.entries(spec.paths || {})) {
     for (const [method, operation] of Object.entries(pathItem as any)) {
       if (method === 'parameters') continue;

       const request = createRequestFromOperation(path, method.toUpperCase(), operation as any, spec, baseUrl);
       const tags = (operation as any).tags || [];
       if (tags.length > 0) {
         const tag = tags[0];
         if (!tagGroups[tag]) tagGroups[tag] = [];
         tagGroups[tag].push(request);
       } else {
         untaggedRequests.push(request);
       }
     }
   }

   let workspaceLocation = '';
   try {
     const homeDir = await window.api.getHomeDirectory();
     workspaceLocation = homeDir ? `${homeDir}/hailstorm/` : '';
   } catch (err) {
     console.debug('Could not get home directory:', err);
   }

   const newId = `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   const collection: any = {
     id: newId,
     name: spec.info.title || 'OpenAPI Import',
     description: spec.info.description,
     items: [],
     variables: [],
     workspaceLocation: `${workspaceLocation}${newId}`
   };

   for (const [tag, requests] of Object.entries(tagGroups)) {
     const folder: any = {
       id: `fol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
       name: tag,
       items: requests
     };
     collection.items.push(folder);
   }

   collection.items.push(...untaggedRequests);
   collectionsStore.collections.push(collection);
   collectionsStore.saveCollections();
 }

function getBaseServerUrl(spec: any): string {
  if (!spec.servers || spec.servers.length === 0) return '';

  const server = spec.servers[0];
  let url = server.url;

  if (server.variables) {
    for (const [key, variable] of Object.entries(server.variables as any)) {
      const defaultValue = (variable as any).default || (variable as any).example || `{${key}}`;
      url = url.replace(`{${key}}`, defaultValue);
    }
  }

  return url;
}

function createRequestFromOperation(path: string, method: string, operation: any, spec: any, baseUrl: string): any {
  const fullUrl = baseUrl ? `${baseUrl}${path}` : path;
  let processedUrl = fullUrl;
  const pathParams = operation.parameters?.filter((p: any) => p.in === 'path') || [];

  for (const param of pathParams) {
    const example = param.example || param.schema?.example || `{${param.name}}`;
    processedUrl = processedUrl.replace(`{${param.name}}`, example);
  }

  const request: any = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: operation.summary || `${method} ${path}`,
    method,
    url: processedUrl,
    headers: [],
    body: { type: 'none', content: '' },
    variables: []
  };

  const queryParams = operation.parameters?.filter((p: any) => p.in === 'query') || [];
  if (queryParams.length > 0) {
    const queryString = queryParams
      .map((param: any) => {
        const example = param.example || param.schema?.example || '';
        return `${param.name}=${encodeURIComponent(example)}`;
      })
      .join('&');

    if (queryString) {
      request.url += (request.url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headerParams = operation.parameters?.filter((p: any) => p.in === 'header') || [];
  for (const param of headerParams) {
    const example = param.example || param.schema?.example || '';
    request.headers.push({
      key: param.name,
      value: example.toString(),
      enabled: true
    });
  }

  if (operation.requestBody) {
    const content = operation.requestBody.content || {};
    const contentType = Object.keys(content)[0];

    if (contentType) {
      request.headers.push({
        key: 'Content-Type',
        value: contentType,
        enabled: true
      });

      if (contentType === 'application/json') {
        const schema = content[contentType].schema;
        const example = generateJsonExample(schema, spec);
        request.body = {
          type: 'raw',
          content: JSON.stringify(example, null, 2)
        };
      } else if (contentType === 'application/x-www-form-urlencoded') {
        const schema = content[contentType].schema;
        const example = generateFormExample(schema, spec);
        request.body = {
          type: 'urlencoded',
          content: example
        };
      } else if (contentType === 'multipart/form-data') {
        const schema = content[contentType].schema;
        const example = generateFormDataExample(schema, spec);
        request.body = {
          type: 'formdata',
          content: JSON.stringify(example)
        };
      }
    }
  }

  return request;
}

function generateJsonExample(schema: any, spec: any, visitedRefs = new Set()): any {
  if (!schema) return {};

  if (schema.$ref) {
    if (visitedRefs.has(schema.$ref)) return {};
    visitedRefs.add(schema.$ref);

    const refPath = schema.$ref.replace('#/', '').split('/');
    let refObj = spec;
    for (const part of refPath) {
      refObj = refObj[part];
    }

    return generateJsonExample(refObj, spec, visitedRefs);
  }

  switch (schema.type) {
    case 'object':
      const obj: any = {};
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties as any)) {
          obj[key] = generateJsonExample(propSchema, spec, visitedRefs);
        }
      }
      return obj;
    case 'array':
      return [generateJsonExample(schema.items, spec, visitedRefs)];
    case 'string':
      return schema.example || schema.default || 'string';
    case 'number':
    case 'integer':
      return schema.example || schema.default || 0;
    case 'boolean':
      return schema.example || schema.default || false;
    default:
      return schema.example || schema.default || null;
  }
}

function generateFormExample(schema: any, spec: any): string {
  if (!schema || !schema.properties) return '';

  const params = [];
  for (const [key, propSchema] of Object.entries(schema.properties as any)) {
    const example = generateJsonExample(propSchema, spec);
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(example)}`);
  }

  return params.join('&');
}

function generateFormDataExample(schema: any, spec: any): any[] {
  if (!schema || !schema.properties) return [];

  const formData = [];
  for (const [key, propSchema] of Object.entries(schema.properties as any)) {
    const example = generateJsonExample(propSchema, spec);
    formData.push({
      key,
      value: example.toString(),
      type: 'text'
    });
  }

  return formData;
}

function clearHistory() {
  historyStore.clearHistory();
}

function generateSecretId(): string {
  return `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveSecrets() {
  if (!secretsStore.isUnlocked) return;

  const encryptedSecrets = appStore.secrets.map(s => ({
    ...s,
    value: secretsStore.simpleEncrypt(s.value, secretsStore.encryptionKey)
  }));
  localStorage.setItem('hailstorm_secrets', JSON.stringify(encryptedSecrets));
}

function loadSecrets() {
  if (!secretsStore.isUnlocked) return;

  const saved = localStorage.getItem('hailstorm_secrets');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appStore.secrets = parsed.map((s: any) => ({
        ...s,
        value: secretsStore.simpleDecrypt(s.value, secretsStore.encryptionKey)
      }));
    } catch (e) {
      console.error('Error parsing secrets:', e);
    }
  }
}

function addSecret() {
  if (!secretsStore.isUnlocked) return;
  const newSecret = { id: generateSecretId(), name: '', env: '', value: '' };
  appStore.secrets.push(newSecret);
  appStore.selectedSecretId = newSecret.id;
  saveSecrets();
}

async function importSecrets() {
  if (!secretsStore.isUnlocked) return;

  try {
    const result = await window.api.importSecretsDialog();
    if (!result) return;

    const { filePath, content } = result;
    if (!content || content.trim().length === 0) {
      alert('The selected file is empty. Please select a valid secrets JSON file.');
      return;
    }

    let importedSecrets;
    try {
      importedSecrets = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      alert(`Invalid JSON file: ${(parseError as Error).message}\n\nPlease ensure the file contains valid JSON.`);
      return;
    }

    if (!Array.isArray(importedSecrets)) {
      alert('Invalid secrets file format. Expected an array of secret objects.\n\nExample format:\n[\n  {\n    "name": "API_KEY",\n    "env": "production",\n    "value": "secret-value"\n  }\n]');
      return;
    }

    if (importedSecrets.length === 0) {
      alert('The file contains an empty array. No secrets to import.');
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;
    let errorMessages: string[] = [];

    for (let i = 0; i < importedSecrets.length; i++) {
      const secret = importedSecrets[i];

      if (!secret || typeof secret !== 'object') {
        errorMessages.push(`Entry ${i + 1}: Not a valid object`);
        skippedCount++;
        continue;
      }

      if (!secret.name || typeof secret.name !== 'string' || secret.name.trim().length === 0) {
        errorMessages.push(`Entry ${i + 1}: Missing or invalid 'name' field (must be non-empty string)`);
        skippedCount++;
        continue;
      }

      const existingSecret = appStore.secrets.find(s => s.name === secret.name.trim());
      if (existingSecret) {
        if (confirm(`A secret with name "${secret.name}" already exists. Overwrite it?\n\nExisting value: ${existingSecret.value ? '[HIDDEN]' : '[EMPTY]'}\nNew value: ${secret.value ? '[HIDDEN]' : '[EMPTY]'}`)) {
          existingSecret.value = secret.value || '';
          existingSecret.env = secret.env || '';
          importedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const newSecret = {
          id: generateSecretId(),
          name: secret.name.trim(),
          env: secret.env || '',
          value: secret.value || ''
        };
        appStore.secrets.push(newSecret);
        importedCount++;
      }
    }

    if (importedCount > 0) {
      saveSecrets();
      let message = `Successfully imported ${importedCount} secrets from:\n\n${filePath}`;
      if (skippedCount > 0) {
        message += `\n\nSkipped ${skippedCount} entries (duplicates or invalid data)`;
      }
      if (errorMessages.length > 0 && errorMessages.length <= 3) {
        message += '\n\nErrors:\n' + errorMessages.slice(0, 3).join('\n');
      }
      alert(message);
    } else {
      let errorMsg = 'No valid secrets could be imported.';
      if (errorMessages.length > 0) {
        errorMsg += '\n\nFirst few errors:\n' + errorMessages.slice(0, 3).join('\n');
      }
      alert(errorMsg);
    }
  } catch (error) {
    console.error('Error importing secrets:', error);
    alert(`Error importing secrets: ${(error as Error).message}\n\nPlease check the file and try again.`);
  }
}

async function exportSecrets() {
  if (!secretsStore.isUnlocked) return;

  try {
    if (appStore.secrets.length === 0) {
      alert('No secrets to export.');
      return;
    }

    if (appStore.secrets.length === 0 || !appStore.secrets[0].value) {
      loadSecrets();
      if (appStore.secrets.length === 0) {
        alert('No secrets available. Please ensure secrets are properly loaded.');
        return;
      }
    }

    const exportData = appStore.secrets.map(secret => ({
      name: secret.name,
      env: secret.env,
      value: secret.value
    }));

    const savedFilePath = await window.api.exportSecretsDialog(JSON.stringify(exportData, null, 2));

    if (savedFilePath) {
      alert(`Successfully exported ${appStore.secrets.length} unencrypted secrets to:\n\n${savedFilePath}\n\nNote: Both 'env' and 'value' fields are exported in plain text.`);
    }
  } catch (error) {
    console.error('Error exporting secrets:', error);
    alert('Error exporting secrets. Please try again.');
  }
}

watch(() => secretsStore.isUnlocked, (unlocked) => {
  if (unlocked) {
    loadSecrets();
  }
}, { immediate: true });

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
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #1e40af;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 6px;
}

.skip-link:not(:focus) {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  width: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

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
