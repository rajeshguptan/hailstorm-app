import { defineStore } from 'pinia';
import type {
  Collection,
  Environment,
  HistoryItem,
  Tab,
  Request,
  Response,
  Secret,
  TestStats,
  SidebarView,
  RequestTab,
  ResponseTab,
  Variable,
  RunConfig,
  SettingsCategory,
  Setting,
  SubSetting,
  Utility
} from '../types';
import { defaultUtilities } from '../utilities';

export const useAppStore = defineStore('app', {
  state: () => ({
    activeSidebar: 'collections' as SidebarView,
    sidebarTitle: 'Collections',

    collections: [] as Collection[],

    environments: [] as Environment[],
    activeEnvironmentId: null as string | null,

    history: [] as HistoryItem[],

    tabs: [] as Tab[],
    activeTabId: null as string | null,

    utilities: [] as Utility[],
    
    currentRequest: {
      id: '',
      name: '',
      method: 'GET',
      url: '',
      headers: [],
      body: { type: 'none', content: '' },
      auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
      variables: []
    } as Request,
    
    urlParams: [] as Variable[],
    requestHeaders: [] as Variable[],
    activeRequestTab: 'params' as RequestTab,
    
    response: null as Response | null,
    activeResponseTab: 'body' as ResponseTab,
    testResults: '',
    isLoading: false,
    
    testStats: { total: 0, passed: 0, failed: 0, avgTime: 0 } as TestStats,
    
    secrets: [] as Secret[],
    selectedSecretId: null as string | null,

    selectedRequestId: null as string | null,

selectedUtilityId: null as string | null,

    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      type: '',
      id: ''
    },

    // Runner configurations
    runConfigs: [] as RunConfig[],
    selectedConfigId: null as string | null,
    
    // Settings
    settingsCategories: [] as SettingsCategory[],
    selectedSettingId: null as string | null,
    selectedSubSettingId: null as string | null,
    
    showEnvModal: false,
    editingEnv: { id: '', name: '', variables: [], active: false } as Environment,
    
    showRenameModal: false,
    renameTarget: { id: '', currentName: '' } as { id: string; currentName: string },
    
    fileInput: null as HTMLInputElement | null,
  }),
  
    getters: {
      showSidebarMain: (state) => {
        return ['collections', 'environments', 'history', 'secrets', 'runner', 'settings'].includes(state.activeSidebar);
      },
      
      currentTab: (state) => {
        return state.tabs.find(t => t.id === state.activeTabId) || null;
      },
      
      activeEnvironment: (state) => {
        return state.environments.find(e => e.id === state.activeEnvironmentId) || null;
      },
      
      selectedSetting: (state) => {
        if (!state.selectedSettingId) return null;
        // Find setting across all categories
        for (const category of state.settingsCategories) {
          const setting = category.settings.find(s => s.id === state.selectedSettingId);
          if (setting) return setting;
          // Check sub-settings
          if (setting?.subSettings) {
            const subSetting = setting.subSettings.find(ss => ss.id === state.selectedSettingId);
            if (subSetting) return subSetting;
          }
        }
        return null;
      },

      selectedRequest: (state) => {
        if (!state.selectedRequestId) return null;
        // Find request recursively in all collections
        for (const collection of state.collections) {
          const findRequest = (items: any[]): any => {
            for (const item of items) {
              let checkItem = item;
              if ('request' in item) {
                checkItem = item.request;
              }
              if (String(checkItem.id) === String(state.selectedRequestId) && 'method' in checkItem) {
                return checkItem;
              }
              if ('items' in item && item.items) {
                const found = findRequest(item.items);
                if (found) return found;
              }
            }
            return null;
          };
          const request = findRequest(collection.items);
          if (request) return request;
        }
        return null;
      }
    },
  
  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    addCollection() {
      const collection: Collection = {
        id: this.generateId('coll'),
        name: 'New Collection',
        items: [],
        variables: []
      };
      this.collections.push(collection);
      this.saveToLocalStorage();
    },
    
    updateCollection(collection: Collection) {
      const index = this.collections.findIndex(c => c.id === collection.id);
      if (index !== -1) {
        this.collections[index] = collection;
        this.saveToLocalStorage();
      }
    },
    
    deleteCollection(id: string) {
      this.collections = this.collections.filter(c => c.id !== id);
      this.saveToLocalStorage();
    },

    deleteRequest(id: string) {
      const deleteFromItems = (items: any[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id && 'method' in items[i]) {
            items.splice(i, 1);
            return true;
          }
          if ('items' in items[i] && items[i].items) {
            if (deleteFromItems(items[i].items)) {
              return true;
            }
          }
        }
        return false;
      };
      for (const collection of this.collections) {
        if (deleteFromItems(collection.items)) {
          this.saveToLocalStorage();
          break;
        }
      }
    },

    deleteFolder(id: string) {
      const deleteFromItems = (items: any[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id && 'items' in items[i]) {
            items.splice(i, 1);
            return true;
          }
          if ('items' in items[i] && items[i].items) {
            if (deleteFromItems(items[i].items)) {
              return true;
            }
          }
        }
        return false;
      };
      for (const collection of this.collections) {
        if (deleteFromItems(collection.items)) {
          this.saveToLocalStorage();
          break;
        }
      }
    },
    
    addFolder(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
      const folder: Folder = {
        id: this.generateId('fol'),
        name: 'New Folder',
        items: []
      };

      if (targetType === 'collection') {
        const collection = this.collections.find(c => c.id === targetId);
        if (collection) {
          collection.items.push(folder);
        }
      } else if (targetType === 'folder') {
        const addToItems = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === targetId) {
              item.items.push(folder);
              return true;
            }
            if ('items' in item && item.items) {
              if (addToItems(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        for (const collection of this.collections) {
          if (addToItems(collection.items)) {
            break;
          }
        }
      }

      this.saveToLocalStorage();
    },

    addRequest(targetId: string, targetType: 'collection' | 'folder' = 'collection') {
      const request: Request = {
        id: this.generateId('req'),
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        body: { type: 'none', content: '' }
      };

      if (targetType === 'collection') {
        const collection = this.collections.find(c => c.id === targetId);
        if (collection) {
          collection.items.push(request);
        }
      } else if (targetType === 'folder') {
        const addToItems = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === targetId) {
              item.items.push(request);
              return true;
            }
            if ('items' in item && item.items) {
              if (addToItems(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        for (const collection of this.collections) {
          if (addToItems(collection.items)) {
            break;
          }
        }
      }

      this.saveToLocalStorage();
    },

    renameItem(id: string, newName: string) {
      // First check if it's a collection itself
      for (const collection of this.collections) {
        if (collection.id === id) {
          collection.name = newName;
          this.saveToLocalStorage();
          return;
        }
      }

      // Then search within collection items
      for (const collection of this.collections) {
        const findAndRename = (items: any[]): boolean => {
          for (const item of items) {
            if (item.id === id) {
              item.name = newName;
              return true;
            }
            if ('items' in item && item.items) {
              if (findAndRename(item.items)) {
                return true;
              }
            }
          }
          return false;
        };

        if (findAndRename(collection.items)) {
          break;
        }
      }
      this.saveToLocalStorage();
    },
    
    findItemById(id: string): any {
      console.log('[STORE] findItemById searching for:', id);

      // First check if it's a collection itself
      for (const collection of this.collections) {
        if (collection.id === id) {
          console.log('[STORE] Found collection:', collection);
          return collection;
        }
      }

      // Then search within collection items
      for (const collection of this.collections) {
        console.log('[STORE] Searching in collection:', collection.name, 'items:', collection.items?.length);
        const findInItems = (items: any[]): any => {
          for (const item of items) {
            console.log('[STORE] Checking item:', item.id, item.name, item.url);
            if (item.id === id) {
              console.log('[STORE] Found item:', item);
              return item;
            }
            if ('items' in item && item.items) {
              const found = findInItems(item.items);
              if (found) return found;
            }
          }
          return null;
        };

        const result = findInItems(collection.items);
        if (result) {
          console.log('[STORE] findItemById returning:', result);
          return result;
        }
      }
      console.log('[STORE] findItemById found nothing');
      return null;
    },
    
    addEnvironment() {
      const env: Environment = {
        id: this.generateId('env'),
        name: 'New Environment',
        variables: [],
        active: false
      };
      this.environments.push(env);
      this.selectEnvironment(env.id);
      this.saveToLocalStorage();
    },
    
    selectEnvironment(id: string) {
      console.log('[STORE] selectEnvironment called with id:', id);
      this.activeEnvironmentId = id;
      this.environments.forEach(e => e.active = e.id === id);
      this.saveToLocalStorage();
    },
    
    updateEnvironment(env: Environment) {
      const index = this.environments.findIndex(e => e.id === env.id);
      if (index !== -1) {
        this.environments[index] = env;
        this.saveToLocalStorage();
      }
    },
    
    deleteEnvironment(id: string) {
      this.environments = this.environments.filter(e => e.id !== id);
      if (this.activeEnvironmentId === id) {
        this.activeEnvironmentId = null;
      }
      this.saveToLocalStorage();
    },
    
    saveEnvironment() {
      const existingIndex = this.environments.findIndex(e => e.id === this.editingEnv.id);
      if (existingIndex !== -1) {
        this.environments[existingIndex] = { ...this.editingEnv };
      } else {
        this.environments.push({ ...this.editingEnv });
      }
      this.showEnvModal = false;
      this.saveToLocalStorage();
    },
    
    addNewTab() {
      const request: Request = {
        id: this.generateId('req'),
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        body: { type: 'none', content: '' }
      };
      const tab: Tab = { id: this.generateId('tab'), request };
      this.tabs.push(tab);
      this.activeTabId = tab.id;
      this.loadTabToCurrent(tab);
      this.saveToLocalStorage();
    },
    
    switchTab(id: string) {
      const tab = this.tabs.find(t => t.id === id);
      if (tab) {
        this.activeTabId = id;
        this.loadTabToCurrent(tab);
      }
    },
    
    closeTab(id: string) {
      const index = this.tabs.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tabs.splice(index, 1);
        if (this.activeTabId === id) {
          if (this.tabs.length > 0) {
            const newIndex = Math.min(index, this.tabs.length - 1);
            this.switchTab(this.tabs[newIndex].id);
          } else {
            this.activeTabId = null;
            this.resetCurrentRequest();
          }
        }
        this.saveToLocalStorage();
      }
    },

    resetCurrentRequest() {
      this.currentRequest = {
        id: '',
        name: '',
        method: 'GET',
        url: '',
        headers: [],
        body: { type: 'none', content: '' },
        auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } }
      };
      this.urlParams = [];
      this.requestHeaders = [];
      this.response = null;
    },
    
    extractParams(url: string): Variable[] {
      try {
        const urlObj = new URL(url);
        const params: Variable[] = [];
        urlObj.searchParams.forEach((value, key) => {
          params.push({ key, value, enabled: true });
        });
        return params;
      } catch {
        return [];
      }
    },
    
    updateUrlFromParams() {
      try {
        const urlObj = new URL(this.currentRequest.url);
        urlObj.search = '';
        let query = '';
        this.urlParams.filter(p => p.enabled).forEach(p => {
          if (query) query += '&';
          query += encodeURIComponent(p.key) + '=' + (p.value.includes('{{') ? p.value : encodeURIComponent(p.value));
        });
        urlObj.search = query ? '?' + query : '';
        this.currentRequest.url = urlObj.toString();
      } catch {
      }
    },
    
    addParam() {
      this.urlParams.push({ key: '', value: '', enabled: true });
      this.updateUrlFromParams();
    },
    
    removeParam(index: number) {
      this.urlParams.splice(index, 1);
      this.updateUrlFromParams();
    },
    
    addHeader() {
      this.requestHeaders.push({ key: '', value: '', enabled: true });
      this.currentRequest.headers = [...this.requestHeaders];
    },
    
    removeHeader(index: number) {
      this.requestHeaders.splice(index, 1);
      this.currentRequest.headers = [...this.requestHeaders];
    },

    openRequest(item: Request | Folder) {
      console.log('openRequest called with:', item, 'keys:', Object.keys(item));
      let requestItem = item;
      if ('request' in item) {
        console.log('Item has nested request, extracting');
        requestItem = (item as any).request;
      }
      if ('method' in requestItem) {
        console.log('Item has method, creating tab for:', requestItem.name, requestItem.url);
        const existingTab = this.tabs.find(t => t.request.id === requestItem.id);
        if (existingTab) {
          console.log('Found existing tab, switching to:', existingTab.id);
          this.switchTab(existingTab.id);
        } else {
          console.log('Creating new tab for request:', requestItem.name, 'URL:', requestItem.url);
          const requestCopy = {
            id: requestItem.id || this.generateId('req'),
            name: requestItem.name || 'Untitled',
            method: requestItem.method || 'GET',
            url: requestItem.url || '',
            headers: requestItem.headers || [],
            body: requestItem.body || { type: 'none', content: '' },
            preRequestScript: requestItem.preRequestScript || '',
            testScript: requestItem.testScript || '',
            flavors: requestItem.flavors || []
          };
          const tab: Tab = { id: this.generateId('tab'), request: requestCopy };
          console.log('Tab created, request in tab:', tab.request.name, tab.request.url);
          this.tabs.push(tab);
          this.activeTabId = tab.id;
          this.loadTabToCurrent(tab);
        }
      }
    },
    
    loadTabToCurrent(tab: Tab) {
      console.log('loadTabToCurrent called with:', tab.request.name, tab.request.url);
      const req = tab.request;
      this.currentRequest = { ...req };
      this.urlParams = this.extractParams(req.url || '');
      this.requestHeaders = (req.headers && req.headers.length > 0) ? [...req.headers] : [];
      console.log('After loadTabToCurrent, currentRequest:', this.currentRequest.name, 'url:', this.currentRequest.url);
    },
    
    addToHistory(item: HistoryItem) {
      this.history.unshift(item);
      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100);
      }
      this.saveToLocalStorage();
    },

    clearHistory() {
      this.history = [];
      this.saveToLocalStorage();
    },

    saveRequest() {
      const request = { 
        ...this.currentRequest, 
        id: this.currentRequest.id || this.generateId('req') 
      };
      if (this.collections.length === 0) {
        this.addCollection();
      }
      this.collections[0].items.push(request);
      this.currentRequest = { ...request };
      this.selectedRequestId = request.id;
      this.saveToLocalStorage();
    },

    updateCurrentRequest() {
      if (!this.selectedRequestId) {
        console.log('updateCurrentRequest: no selectedRequestId, cannot update');
        return;
      }
      console.log('updateCurrentRequest: updating item with id:', this.selectedRequestId);
      console.log('updateCurrentRequest: collections length:', this.collections.length);
      if (this.collections.length > 0) {
        console.log('updateCurrentRequest: first collection items count:', this.collections[0].items.length);
      }
      const updateInItems = (items: any[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          console.log('updateCurrentRequest: checking item', i, 'id:', items[i].id);
          if (items[i].id === this.selectedRequestId) {
            console.log('updateCurrentRequest: found matching item at index', i);
            if ('request' in items[i]) {
              items[i].request = { ...this.currentRequest };
            } else {
              Object.assign(items[i], this.currentRequest);
            }
            return true;
          }
          if ('items' in items[i] && items[i].items) {
            console.log('updateCurrentRequest: checking nested items of item', i);
            if (updateInItems(items[i].items)) {
              return true;
            }
          }
        }
        return false;
      };
      for (const collection of this.collections) {
        console.log('updateCurrentRequest: checking collection:', collection.name);
        if (updateInItems(collection.items)) {
          console.log('updateCurrentRequest: found and updated!');
          break;
        }
      }
      console.log('updateCurrentRequest: after update, collections[0] items:', JSON.stringify(this.collections[0]?.items));
      this.saveToLocalStorage();
    },
    
    loadFromHistory(item: HistoryItem) {
      // Load the request data into current request
      this.currentRequest = JSON.parse(JSON.stringify(item.request));

      // Convert headers to the expected format
      this.requestHeaders = item.request.headers ? item.request.headers.map(h => ({ ...h, enabled: h.enabled !== false })) : [];

      // Load the response data
      this.response = item.response;

      // Set selectedRequestId to enable showing the panels
      this.selectedRequestId = item.id.toString();

      // Switch to body tab to show response
      this.activeResponseTab = 'body';
    },

    // Clear selections on startup to keep main content empty
    clearSelections() {
      this.selectedRequestId = null;
      this.selectedSecretId = null;
      this.selectedUtilityId = null;
      // Keep activeEnvironmentId for variable substitution
    },

    showContextMenu(e: MouseEvent, type: string, id: string) {
      this.contextMenu.show = true;
      this.contextMenu.x = e.clientX;
      this.contextMenu.y = e.clientY;
      this.contextMenu.type = type;
      this.contextMenu.id = id;
    },
    
    hideContextMenu() {
      this.contextMenu.show = false;
    },
    
    saveToLocalStorage() {
      try {
        const data = JSON.stringify(this.$state);
        localStorage.setItem('hailstorm-data', data);
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    },
    
    loadFromLocalStorage() {
      const data = localStorage.getItem('hailstorm-data');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.collections = parsed.collections || [];
          console.log('[STORE] Loaded collections from localStorage:', this.collections.map(c => ({
            name: c.name,
            itemsCount: c.items?.length || 0,
            firstItem: c.items?.[0] ? {
              name: c.items[0].name,
              method: c.items[0].method,
              url: c.items[0].url,
              hasBody: !!c.items[0].body,
              bodyType: c.items[0].body?.type
            } : null
          })));
          this.environments = parsed.environments || [];
          console.log('[STORE] Loading activeEnvironmentId from localStorage:', parsed.activeEnvironmentId);
          this.activeEnvironmentId = parsed.activeEnvironmentId || null;
          console.log('[STORE] Set activeEnvironmentId to:', this.activeEnvironmentId);
          if (this.activeEnvironmentId) {
            console.log('[DEBUG] activeEnvironmentId is set on startup, environments:', this.environments.map(e => ({ id: e.id, name: e.name, active: e.active })));
          }
          this.history = parsed.history || [];
          this.utilities = (parsed.utilities || defaultUtilities).map(u => ({
            ...u,
            postProcessScript: u.postProcessScript || ''
          }));
          this.runConfigs = parsed.runConfigs || [];
          this.selectedConfigId = parsed.selectedConfigId || null;
          this.selectedUtilityId = parsed.selectedUtilityId || null;
          this.selectedRequestId = parsed.selectedRequestId || null;
          this.activeSidebar = 'collections'; // Always start with collections for empty main content
          this.sidebarTitle = 'Collections';

      // Clear selections on startup to ensure main-content is empty, but keep activeEnvironmentId for variable substitution
      this.clearSelections();
        } catch (err) {
          console.error('Failed to load from localStorage:', err);
        }
      }

      if (this.tabs.length === 0) {
        this.addNewTab();
      }
    },
    
    init() {
      this.loadFromLocalStorage();
      document.addEventListener('click', () => {
        this.contextMenu.show = false;
      });
    },
    
    // Settings actions
    loadDefaultSettings() {
      this.settingsCategories = [
        {
          id: 'ui',
          name: 'User Interface',
          icon: '🎨',
          settings: [
            {
              id: 'theme',
              name: 'Theme',
              description: 'Choose your preferred color scheme',
              subSettings: [
                { id: 'theme-light', name: 'Light', icon: '☀️' },
                { id: 'theme-dark', name: 'Dark', icon: '🌙' },
                { id: 'theme-system', name: 'System', icon: '💻' }
              ]
            },
            {
              id: 'font',
              name: 'Font Size',
              description: 'Adjust font sizes for better readability',
              subSettings: [
                { id: 'font-ui', name: 'UI Font Size', icon: '🔤' },
                { id: 'font-code', name: 'Code Font Size', icon: '</>' },
                { id: 'font-editor', name: 'Editor Font Size', icon: '📝' }
              ]
            },
            {
              id: 'layout',
              name: 'Layout',
              description: 'Customize application layout',
              subSettings: [
                { id: 'layout-sidebar', name: 'Show Sidebar', icon: '📑' },
                { id: 'layout-compact', name: 'Compact Mode', icon: '📐' },
                { id: 'layout-autosave', name: 'Auto-save Requests', icon: '💾' }
              ]
            }
          ]
        },
        {
          id: 'app',
          name: 'Application',
          icon: '⚙️',
          settings: [
            {
              id: 'network',
              name: 'Network',
              description: 'Configure network settings',
              subSettings: [
                { id: 'network-timeout', name: 'Request Timeout', icon: '⏱️' },
                { id: 'network-max-size', name: 'Max Response Size', icon: '📦' },
                { id: 'network-redirects', name: 'Follow Redirects', icon: '🔄' },
                { id: 'network-ssl', name: 'SSL Verification', icon: '🔒' }
              ]
            },
            {
              id: 'certificate',
              name: 'Certificates',
              description: 'Manage SSL certificates',
              subSettings: [
                { id: 'cert-manager', name: 'Certificate Manager', icon: '📜' }
              ]
            },
            {
              id: 'proxy',
              name: 'Proxy',
              description: 'Configure proxy settings',
              subSettings: [
                { id: 'proxy-url', name: 'Proxy URL', icon: '🌐' },
                { id: 'proxy-username', name: 'Username', icon: '👤' },
                { id: 'proxy-password', name: 'Password', icon: '🔑' }
              ]
            },
            {
              id: 'variables',
              name: 'Variables',
              description: 'Configure global variables',
              subSettings: [
                { id: 'vars-list', name: 'Variables List', icon: '📋' },
                { id: 'vars-add', name: 'Add Variable', icon: '➕' }
              ]
            }
          ]
        },
        {
          id: 'advanced',
          name: 'Advanced',
          icon: '🔧',
          settings: [
            {
              id: 'shortcuts',
              name: 'Keyboard Shortcuts',
              description: 'View and customize keyboard shortcuts',
              subSettings: [
                { id: 'shortcuts-view', name: 'View Shortcuts', icon: '⌨️' }
              ]
            },
            {
              id: 'about',
              name: 'About',
              description: 'Application information',
              subSettings: [
                { id: 'about-info', name: 'About Hailstorm', icon: 'ℹ️' }
              ]
            }
          ]
        }
      ];
      this.saveToLocalStorage();
    },
    
    selectSetting(id: string) {
      this.selectedSettingId = id;
      this.selectedSubSettingId = null;
      this.saveToLocalStorage();
    },
    
    selectSubSetting(id: string) {
      this.selectedSubSettingId = id;
      this.saveToLocalStorage();
    },
    
    resetSettingsToDefaults() {
      this.loadDefaultSettings();
    },
    
    // Runner configuration actions
    addRunConfig() {
      const config: RunConfig = {
        id: this.generateId('run'),
        name: 'New Run Config',
        collectionId: '',
        collectionName: '',
        selectedRequests: [],
        runMode: 'sequential',
        delay: 1000,
        runRepeated: false,
        iterations: 1
      };
      this.runConfigs.push(config);
      this.selectRunConfig(config.id);
      this.saveToLocalStorage();
    },
    
    selectRunConfig(id: string) {
      this.selectedConfigId = id;
      this.saveToLocalStorage();
    },

    selectRequest(id: string | null) {
      console.log('[STORE] selectRequest called with id:', id);
      if (!id) {
        console.log('[STORE] No id provided, resetting currentRequest');
        this.selectedRequestId = null;
        this.currentRequest = {
          id: '',
          name: '',
          method: 'GET',
          url: '',
          headers: [],
          body: { type: 'none', content: '' },
          auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
          variables: []
        };
        return;
      }

      this.selectedRequestId = id;
      console.log('[STORE] selectedRequestId set to:', this.selectedRequestId);

      // Load the selected request into currentRequest for editing
      if (id) {
        console.log('[STORE] Loading request with id:', id);
        const item = this.findItemById(id);
        console.log('[STORE] Found item:', item);
        if (item) {
          const request = 'request' in item ? item.request : item;
          console.log('[STORE] Using request data:', request);
          console.log('[STORE] Request URL:', request.url, 'Body:', request.body);
          this.currentRequest = {
            id: request.id || '',
            name: item.name || request.name || '',
            method: request.method || 'GET',
            url: request.url || '',
            headers: request.headers || [],
            body: request.body || { type: 'none', content: '' },
            auth: request.auth || { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
            preRequestScript: request.preRequestScript || '',
            testScript: request.testScript || '',
            flavors: request.flavors || [],
            variables: request.variables || []
          };
          console.log('[STORE] Set currentRequest:', {
            id: this.currentRequest.id,
            name: this.currentRequest.name,
            method: this.currentRequest.method,
            url: this.currentRequest.url,
            body: this.currentRequest.body,
            bodyType: this.currentRequest.body?.type,
            bodyContent: this.currentRequest.body?.content?.substring(0, 50)
          });
          // Convert headers to the expected format
          this.requestHeaders = request.headers ? request.headers.map(h => ({ ...h, enabled: h.enabled !== false })) : [];
          // Extract URL params
          this.urlParams = this.extractParams(request.url || '');
        }
      } else {
        // Reset to default request when no request is selected
        this.currentRequest = {
          id: '',
          name: '',
          method: 'GET',
          url: '',
          headers: [],
          body: { type: 'none', content: '' },
          auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
          variables: []
        };
        this.requestHeaders = [];
        this.urlParams = [];
      }

      this.saveToLocalStorage();
    },

    selectUtility(id: string | null) {
      this.selectedUtilityId = id;
      this.saveToLocalStorage();
    },

    addUtility() {
      const utility: Utility = {
        id: this.generateId('utility'),
        name: 'New Utility',
        icon: '🔧',
        command: '',
        postProcessScript: ''
      };
      this.utilities.push(utility);
      this.saveToLocalStorage();
    },

    updateUtility(utility: Utility) {
      const index = this.utilities.findIndex(u => u.id === utility.id);
      if (index !== -1) {
        this.utilities[index] = utility;
        this.saveToLocalStorage();
      }
    },

    deleteUtility(id: string) {
      this.utilities = this.utilities.filter(u => u.id !== id);
      if (this.selectedUtilityId === id) {
        this.selectedUtilityId = null;
      }
      this.saveToLocalStorage();
    },
    
    updateRunConfig(config: RunConfig) {
      const index = this.runConfigs.findIndex(c => c.id === config.id);
      if (index !== -1) {
        this.runConfigs[index] = config;
        this.saveToLocalStorage();
      }
    },
    
    deleteRunConfig(id: string) {
      this.runConfigs = this.runConfigs.filter(c => c.id !== id);
      if (this.selectedConfigId === id) {
        this.selectedConfigId = this.runConfigs.length > 0 ? this.runConfigs[0].id : null;
      }
      this.saveToLocalStorage();
    }
  }
});
