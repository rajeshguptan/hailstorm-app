import { defineStore } from 'pinia';
import type { Secret } from '../types';
import { useCollectionsStore } from './collections';
import { useRequestsStore } from './requests';
import { useEnvironmentsStore } from './environments';
import { useUIStore } from './ui';
import { useResponseStore } from './response';
import { useHistoryStore } from './history';
import { useRunnerStore } from './runner';
import { useSettingsStore } from './settings';
import { useSecretsStore } from './secrets';

export const useAppStore = defineStore('app', {
  state: () => ({
    secrets: [] as Secret[],
    selectedSecretId: null as string | null,
    collections: [] as any[],
  }),

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

saveToLocalStorage() {
      try {
        const collectionsStore = useCollectionsStore();
        const requestsStore = useRequestsStore();
        const environmentsStore = useEnvironmentsStore();
        const uiStore = useUIStore();
        const responseStore = useResponseStore();
        const historyStore = useHistoryStore();
        const runnerStore = useRunnerStore();
        const settingsStore = useSettingsStore();

        const data = {
          collections: collectionsStore.collections,
          selectedCollectionId: collectionsStore.selectedCollectionId,
          currentRequest: requestsStore.currentRequest,
          urlParams: requestsStore.urlParams,
          requestHeaders: requestsStore.requestHeaders,
          activeRequestTab: requestsStore.activeRequestTab,
          tabs: requestsStore.tabs,
          activeTabId: requestsStore.activeTabId,
          selectedRequestId: requestsStore.selectedRequestId,
          environments: environmentsStore.environments,
          activeEnvironmentId: environmentsStore.activeEnvironmentId,
          activeSidebar: uiStore.activeSidebar,
          sidebarTitle: uiStore.sidebarTitle,
          showEnvModal: uiStore.showEnvModal,
          editingEnv: uiStore.editingEnv,
          showRenameModal: uiStore.showRenameModal,
          renameTarget: uiStore.renameTarget,
          response: responseStore.response,
          activeResponseTab: responseStore.activeResponseTab,
          testResults: responseStore.testResults,
          scriptSource: responseStore.scriptSource,
          testStats: responseStore.testStats,
          history: historyStore.history,
          runConfigs: runnerStore.runConfigs,
          selectedConfigId: runnerStore.selectedConfigId,
          settingsCategories: settingsStore.settingsCategories,
          selectedSettingId: settingsStore.selectedSettingId,
          selectedSubSettingId: settingsStore.selectedSubSettingId,
          selectedSecretId: this.selectedSecretId,
        };

        this.collections = collectionsStore.collections;
        const dataStr = JSON.stringify(data);
        localStorage.setItem('hailstorm-data', dataStr);
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    },

     async loadFromLocalStorage() {
       const data = localStorage.getItem('hailstorm-data');
       if (data) {
         try {
           const parsed = JSON.parse(data);
           const collectionsStore = useCollectionsStore();
           const requestsStore = useRequestsStore();
           const environmentsStore = useEnvironmentsStore();
           const uiStore = useUIStore();
           const responseStore = useResponseStore();
           const historyStore = useHistoryStore();
           const runnerStore = useRunnerStore();
           const settingsStore = useSettingsStore();

           const collectionsData = parsed.collections || [];
           collectionsStore.collections = [];
           for (const coll of collectionsData) {
             if (coll.workspaceLocation) {
               try {
                 const loadedCollection = await window.api.loadCollectionFromFiles(coll.name, coll.workspaceLocation);
                 if (loadedCollection) {
                   collectionsStore.collections.push(loadedCollection);
                 } else {
                   const { workspaceLocation, ...collWithoutWorkspace } = coll;
                   collectionsStore.collections.push(collWithoutWorkspace);
                 }
               } catch (error) {
                 const { workspaceLocation, ...collWithoutWorkspace } = coll;
                 collectionsStore.collections.push(collWithoutWorkspace);
               }
             } else {
               collectionsStore.collections.push(coll);
             }
           }

           collectionsStore.selectedCollectionId = parsed.selectedCollectionId || null;
           this.collections = collectionsStore.collections;
           requestsStore.currentRequest = parsed.currentRequest || requestsStore.currentRequest;
           requestsStore.urlParams = parsed.urlParams || [];
           requestsStore.requestHeaders = parsed.requestHeaders || [];
           requestsStore.activeRequestTab = parsed.activeRequestTab || 'params';
           requestsStore.tabs = parsed.tabs || [];
           requestsStore.activeTabId = parsed.activeTabId || null;
           requestsStore.selectedRequestId = parsed.selectedRequestId || null;
           environmentsStore.environments = parsed.environments || [];
           environmentsStore.activeEnvironmentId = parsed.activeEnvironmentId || null;
           uiStore.activeSidebar = parsed.activeSidebar || 'collections';
           uiStore.sidebarTitle = parsed.sidebarTitle || 'Collections';
           uiStore.showEnvModal = parsed.showEnvModal || false;
           uiStore.editingEnv = parsed.editingEnv || uiStore.editingEnv;
           uiStore.showRenameModal = parsed.showRenameModal || false;
           uiStore.renameTarget = parsed.renameTarget || uiStore.renameTarget;
           responseStore.response = parsed.response || null;
           responseStore.activeResponseTab = parsed.activeResponseTab || 'body';
           responseStore.testResults = parsed.testResults || '';
           responseStore.scriptSource = parsed.scriptSource || 'testScript';
           responseStore.testStats = parsed.testStats || responseStore.testStats;
           historyStore.history = (parsed.history || []).map((item: any) => ({
             ...item,
             timestamp: item.timestamp || item.id
           }));
           runnerStore.runConfigs = parsed.runConfigs || [];
           runnerStore.selectedConfigId = parsed.selectedConfigId || null;
           if (parsed.settingsCategories && parsed.settingsCategories.length > 0) {
             settingsStore.settingsCategories = parsed.settingsCategories;
           } else {
             settingsStore.loadDefaultSettings();
           }
           settingsStore.selectedSettingId = parsed.selectedSettingId || null;
           settingsStore.selectedSubSettingId = parsed.selectedSubSettingId || null;
           this.selectedSecretId = parsed.selectedSecretId || null;
           console.log('[STORE] Loaded data from localStorage');
         } catch (err) {
           console.error('Failed to load from localStorage:', err);
         }
       }
       const requestsStore = useRequestsStore();
       if (requestsStore.tabs.length === 0) {
         requestsStore.addNewTab();
       }
     },

     clearSelections() {
       const requestsStore = useRequestsStore();
       const collectionsStore = useCollectionsStore();
       requestsStore.selectedRequestId = null;
       collectionsStore.selectedCollectionId = null;
       this.selectedSecretId = null;
     },

     renameItem(id: string, newName: string) {
       console.log('[APP_STORE] renameItem called with id:', id, 'newName:', newName);
       const collectionsStore = useCollectionsStore();
       collectionsStore.renameItem(id, newName);
       console.log('[APP_STORE] renameItem completed');
     },

     async init() {
       await this.loadFromLocalStorage();
       document.addEventListener('click', () => {
         const uiStore = useUIStore();
         uiStore.hideContextMenu();
       });
     }
   }
 });