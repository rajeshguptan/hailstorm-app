import { defineStore } from 'pinia';
import type { Request, Tab, Variable, RequestTab, Folder } from '../types';
import { useAppStore } from './';
import { useCollectionsStore } from './collections';
import { useResponseStore } from './response';

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    currentRequest: {
      id: '',
      name: '',
      method: 'GET',
      url: '',
      headers: [],
      body: { type: 'none', content: '' },
      auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' }, ntlm: {}, clientCertificate: { type: 'pkcs12' }, oauth2: { grantType: 'client_credentials' } },
      variables: []
    } as Request,

    urlParams: [] as Variable[],
    requestHeaders: [] as Variable[],
    activeRequestTab: 'params' as RequestTab,

    tabs: [] as Tab[],
    activeTabId: null as string | null,

    selectedRequestId: null as string | null,
  }),

  getters: {
    currentTab: (state) => {
      return state.tabs.find(t => t.id === state.activeTabId) || null;
    }
  },

  actions: {
    generateId(prefix: string): string {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    switchTab(id: string) {
      const tab = this.tabs.find(t => t.id === id);
      if (tab) {
        this.activeTabId = id;
        this.loadTabToCurrent(tab);
        const appStore = useAppStore();
        appStore.saveToLocalStorage();
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
        const appStore = useAppStore();
        appStore.saveToLocalStorage();
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
        auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' }, ntlm: {}, clientCertificate: { type: 'pkcs12' } }
      };
      this.urlParams = [];
      this.requestHeaders = [];
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
        // Invalid URL, do nothing
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
              flavors: requestItem.flavors || [],
              variables: requestItem.variables || [],
              dependsOn: requestItem.dependsOn || undefined
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

    saveRequest() {
      const collectionsStore = useCollectionsStore();
      const request = {
        ...this.currentRequest,
        id: this.currentRequest.id || this.generateId('req')
      };
      if (collectionsStore.collections.length === 0) {
        collectionsStore.addCollection();
      }
      collectionsStore.collections[0].items.push(request);
      this.currentRequest = { ...request };
      this.selectedRequestId = request.id;
    },

    updateCurrentRequest() {
      if (!this.selectedRequestId) {
        console.log('updateCurrentRequest: no selectedRequestId, cannot update');
        return;
      }
      console.log('updateCurrentRequest: updating item with id:', this.selectedRequestId);
      const collectionsStore = useCollectionsStore();
      if (collectionsStore.collections.length > 0) {
        console.log('updateCurrentRequest: first collection items count:', collectionsStore.collections[0].items.length);
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
      for (const collection of collectionsStore.collections) {
        console.log('updateCurrentRequest: checking collection:', collection.name);
        if (updateInItems(collection.items)) {
          console.log('updateCurrentRequest: found and updated!');
          break;
        }
      }
      console.log('updateCurrentRequest: after update, collections[0] items:', JSON.stringify(collectionsStore.collections[0]?.items));
    },

selectRequest(id: string | null) {
      console.log('[REQUESTS] selectRequest called with id:', id);
      if (!id) {
        console.log('[REQUESTS] No id provided, resetting currentRequest');
        this.selectedRequestId = null;
        this.currentRequest = {
          id: '',
          name: '',
          method: 'GET',
          url: '',
          headers: [],
          body: { type: 'none', content: '' },
          auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' }, ntlm: {}, clientCertificate: { type: 'pkcs12' } },
          variables: []
        };
        this.requestHeaders = [];
        this.urlParams = [];
        const appStore = useAppStore();
        appStore.saveToLocalStorage();
        return;
      }

      this.selectedRequestId = id;
      console.log('[REQUESTS] selectedRequestId set to:', this.selectedRequestId);

      // Load the selected request into currentRequest for editing
      if (id) {
        console.log('[REQUESTS] Loading request with id:', id);
        const collectionsStore = useCollectionsStore();
        const item = collectionsStore.findItemById(id);
        console.log('[REQUESTS] Found item:', item);
        if (item) {
          const request = 'request' in item ? item.request : item;
          console.log('[REQUESTS] Using request data:', request);
          console.log('[REQUESTS] Request URL:', request.url, 'Body:', request.body);
          this.currentRequest = {
            id: request.id || '',
            name: item.name || request.name || '',
            method: request.method || 'GET',
            url: request.url || '',
            headers: request.headers || [],
            body: request.body || { type: 'none', content: '' },
            auth: request.auth || { type: 'noauth', apikey: { key: '', value: '', in: 'header' }, ntlm: {}, clientCertificate: { type: 'pkcs12' } },
            preRequestScript: request.preRequestScript || '',
            testScript: request.testScript || '',
            flavors: request.flavors || [],
            variables: request.variables || [],
            dependsOn: request.dependsOn || undefined,
            response: request.response
          };
          console.log('[REQUESTS] Set currentRequest:', {
            id: this.currentRequest.id,
            name: this.currentRequest.name,
            method: this.currentRequest.method,
            url: this.currentRequest.url,
            body: this.currentRequest.body,
            bodyType: this.currentRequest.body?.type,
            bodyContent: this.currentRequest.body?.content?.substring(0, 50)
          });
          // Set response if available
          const responseStore = useResponseStore();
          responseStore.setResponse(request.response || null);
          // Convert headers to the expected format
          this.requestHeaders = request.headers ? request.headers.map(h => ({ ...h, enabled: h.enabled !== false })) : [];
          // Extract URL params
          this.urlParams = this.extractParams(request.url || '');
        } else {
          // Reset to default request when no request is selected
          this.currentRequest = {
            id: '',
            name: '',
            method: 'GET',
            url: '',
            headers: [],
            body: { type: 'none', content: '' },
            auth: { type: 'noauth', apikey: { key: '', value: '', in: 'header' }, ntlm: {}, clientCertificate: { type: 'pkcs12' } },
            variables: []
          };
          this.requestHeaders = [];
          this.urlParams = [];
        }

        const appStore = useAppStore();
        appStore.saveToLocalStorage();
      }
    }
  }
});