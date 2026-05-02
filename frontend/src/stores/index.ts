import { defineStore } from 'pinia';
import type { Secret } from '../types';
import { defaultUtilities } from '../utilities';
import { useCollectionsStore } from './collections';
import { useRequestsStore } from './requests';
import { useEnvironmentsStore } from './environments';
import { useUIStore } from './ui';
import { useResponseStore } from './response';
import { useHistoryStore } from './history';
import { useRunnerStore } from './runner';
import { useSettingsStore } from './settings';
import { useUtilitiesStore } from './utilities';
import { useSecretsStore } from './secrets';

export const useAppStore = defineStore('app', {
  state: () => ({
    secrets: [] as Secret[],
    selectedSecretId: null as string | null,
  }),

  actions: {
    // Shared utilities
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
        const utilitiesStore = useUtilitiesStore();

        const data = {
          // Collections
          collections: collectionsStore.collections,
          selectedCollectionId: collectionsStore.selectedCollectionId,

          // Requests
          currentRequest: requestsStore.currentRequest,
          urlParams: requestsStore.urlParams,
          requestHeaders: requestsStore.requestHeaders,
          activeRequestTab: requestsStore.activeRequestTab,
          tabs: requestsStore.tabs,
          activeTabId: requestsStore.activeTabId,
          selectedRequestId: requestsStore.selectedRequestId,

          // Environments
          environments: environmentsStore.environments,
          activeEnvironmentId: environmentsStore.activeEnvironmentId,

          // UI
          activeSidebar: uiStore.activeSidebar,
          sidebarTitle: uiStore.sidebarTitle,
          showEnvModal: uiStore.showEnvModal,
          editingEnv: uiStore.editingEnv,
          showRenameModal: uiStore.showRenameModal,
          renameTarget: uiStore.renameTarget,

          // Response
          response: responseStore.response,
          activeResponseTab: responseStore.activeResponseTab,
          testResults: responseStore.testResults,
          testStats: responseStore.testStats,

          // History
          history: historyStore.history,

          // Runner
          runConfigs: runnerStore.runConfigs,
          selectedConfigId: runnerStore.selectedConfigId,

          // Settings
          settingsCategories: settingsStore.settingsCategories,
          selectedSettingId: settingsStore.selectedSettingId,
          selectedSubSettingId: settingsStore.selectedSubSettingId,

          // Utilities
          utilities: utilitiesStore.utilities,
          selectedUtilityId: utilitiesStore.selectedUtilityId,

          // App-level
          selectedSecretId: this.selectedSecretId,
        };

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
          const utilitiesStore = useUtilitiesStore();

          // Load collections with file-based handling
          const collectionsData = parsed.collections || [];
          collectionsStore.collections = [];
          for (const coll of collectionsData) {
            if (coll.workspaceLocation) {
              try {
                const loadedCollection = await window.api.loadCollectionFromFiles(coll.name, coll.workspaceLocation);
                if (loadedCollection) {
                  collectionsStore.collections.push(loadedCollection);
                  console.log('[STORE] Loaded collection from files:', coll.name);
                } else {
                  collectionsStore.collections.push(coll);
                  console.log('[STORE] Failed to load from files, using localStorage data for:', coll.name);
                }
              } catch (error) {
                console.error('[STORE] Error loading collection from files:', coll.name, error);
                // Remove workspaceLocation to prevent future attempts to load from files
                const { workspaceLocation, ...collWithoutWorkspace } = coll;
                collectionsStore.collections.push(collWithoutWorkspace);
              }
            } else {
              collectionsStore.collections.push(coll);
            }
          }

          collectionsStore.selectedCollectionId = parsed.selectedCollectionId || null;

          // Load other stores
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
             // Load default settings if none exist
             settingsStore.loadDefaultSettings();
           }
           settingsStore.selectedSettingId = parsed.selectedSettingId || null;
           settingsStore.selectedSubSettingId = parsed.selectedSubSettingId || null;

          utilitiesStore.utilities = (parsed.utilities || defaultUtilities).map(u => ({
            ...u,
            postProcessScript: u.postProcessScript || ''
          }));
          utilitiesStore.selectedUtilityId = parsed.selectedUtilityId || null;

          // App-level data
          // Secrets are now handled by the secrets store
          this.selectedSecretId = parsed.selectedSecretId || null;

          console.log('[STORE] Loaded data from localStorage');
        } catch (err) {
          console.error('Failed to load from localStorage:', err);
        }
      }

      // Initialize tabs if none exist
      const requestsStore = useRequestsStore();
      if (requestsStore.tabs.length === 0) {
        requestsStore.addNewTab();
      }
    },

    // Clear selections on startup
    clearSelections() {
      const requestsStore = useRequestsStore();
      const collectionsStore = useCollectionsStore();
      const utilitiesStore = useUtilitiesStore();

      requestsStore.selectedRequestId = null;
      collectionsStore.selectedCollectionId = null;
      utilitiesStore.selectedUtilityId = null;
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