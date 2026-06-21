import { defineStore } from 'pinia';
import type { Auth, Request, Tab, Variable, RequestTab, Folder } from '../types';
import { useAppStore } from './';
import { useCollectionsStore } from './collections';
import { useResponseStore } from './response';
import { logger } from '../utils/logger';

function getDefaultAuth(): Auth {
  return {
    type: 'noauth',
    apikey: { key: '', value: '', in: 'header' },
    ntlm: {},
    clientCertificate: { type: 'pkcs12' },
    oauth2: { grantType: 'client_credentials' }
  };
}

export function normalizeRequestAuth(auth?: Auth): Auth {
  return {
    ...getDefaultAuth(),
    ...auth,
    apikey: { ...getDefaultAuth().apikey, ...auth?.apikey },
    ntlm: { ...getDefaultAuth().ntlm, ...auth?.ntlm },
    clientCertificate: { ...getDefaultAuth().clientCertificate, ...auth?.clientCertificate },
    oauth2: { ...getDefaultAuth().oauth2, ...auth?.oauth2 }
  };
}

export const useRequestsStore = defineStore('requests', {
state: () => ({
     currentRequest: {
       id: '',
       name: '',
       method: 'GET',
       url: '',
       headers: [],
       body: { type: 'none', content: '' },
       auth: getDefaultAuth(),
       preRequestScript: '',
       postRequestScript: '',
       testScript: '',
       variables: [],
       description: ''
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
         body: { type: 'none', content: '' },
         auth: getDefaultAuth(),
         preRequestScript: '',
         postRequestScript: '',
         testScript: '',
         variables: [],
         description: ''
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
         auth: getDefaultAuth(),
         preRequestScript: '',
         postRequestScript: '',
         testScript: '',
         variables: [],
         description: ''
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
        logger.debug('[REQUESTS] openRequest called with:', item);
        let requestItem = item;
        if ('request' in item) {
          requestItem = (item as any).request;
        }
        if ('method' in requestItem) {
          const existingTab = this.tabs.find(t => t.request.id === requestItem.id);
          if (existingTab) {
            this.switchTab(existingTab.id);
          } else {
            logger.debug('[REQUESTS] Creating new tab for request:', requestItem.name, 'URL:', requestItem.url);
            const requestCopy = {
                 id: requestItem.id || this.generateId('req'),
                 name: requestItem.name || 'Untitled',
                 method: requestItem.method || 'GET',
                 url: requestItem.url || '',
                 headers: requestItem.headers || [],
                 body: requestItem.body || { type: 'none', content: '' },
                 auth: normalizeRequestAuth(requestItem.auth),
                 preRequestScript: requestItem.preRequestScript || '',
                 postRequestScript: requestItem.postRequestScript || '',
                 testScript: requestItem.testScript || '',
                 flavors: requestItem.flavors || [],
                  variables: requestItem.variables || [],
                  dependsOn: requestItem.dependsOn || undefined,
                  response: requestItem.response,
                  description: requestItem.description || '',
                  isJsonRpc: requestItem.isJsonRpc,
                  isWebSocket: requestItem.isWebSocket
                };
            const tab: Tab = { id: this.generateId('tab'), request: requestCopy };
            this.tabs.push(tab);
            this.activeTabId = tab.id;
            this.loadTabToCurrent(tab);
          }
        }
      },

      loadTabToCurrent(tab: Tab) {
        logger.debug('[REQUESTS] loadTabToCurrent called with:', tab.request.name, tab.request.url);
        const req = tab.request;
        this.currentRequest = {
          ...req,
          auth: normalizeRequestAuth(req.auth)
        };
        this.urlParams = this.extractParams(req.url || '');
        this.requestHeaders = (req.headers && req.headers.length > 0) ? [...req.headers] : [];
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
          logger.debug('[REQUESTS] updateCurrentRequest: no selectedRequestId, cannot update');
          return;
        }
        logger.debug('[REQUESTS] updateCurrentRequest: updating item with id:', this.selectedRequestId);
        const collectionsStore = useCollectionsStore();
        const updateInItems = (items: any[]): boolean => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].id === this.selectedRequestId) {
              if ('request' in items[i]) {
                items[i].request = { ...this.currentRequest };
              } else {
                Object.assign(items[i], this.currentRequest);
              }
              return true;
            }
            if ('items' in items[i] && items[i].items) {
              if (updateInItems(items[i].items)) {
                return true;
              }
            }
          }
          return false;
        };
        for (const collection of collectionsStore.collections) {
          if (updateInItems(collection.items)) {
            logger.debug('[REQUESTS] updateCurrentRequest: found and updated!');
            break;
          }
        }
},

    selectRequest(id: string | null) {
      logger.debug('[REQUESTS] selectRequest called with id:', id);
      if (!id) {
        this.selectedRequestId = null;
        this.currentRequest = {
          id: '',
          name: '',
          method: 'GET',
          url: '',
          headers: [],
          body: { type: 'none', content: '' },
          auth: getDefaultAuth(),
          preRequestScript: '',
          postRequestScript: '',
          testScript: '',
          variables: [],
          description: ''
        };
        this.requestHeaders = [];
        this.urlParams = [];
        const appStore = useAppStore();
        appStore.saveToLocalStorage();
        return;
      }

      const collectionsStore = useCollectionsStore();
      const item = collectionsStore.findItemById(id);
      logger.debug('[REQUESTS] Found item:', item);
      if (item) {
        this.selectedRequestId = id;
        const request = 'request' in item ? item.request : item;
        logger.debug('[REQUESTS] Using request data:', request);
        this.currentRequest = {
          id: request.id || '',
          name: item.name || request.name || '',
          method: request.method || 'GET',
          url: request.url || '',
          headers: request.headers || [],
          body: request.body || { type: 'none', content: '' },
          auth: normalizeRequestAuth(request.auth),
          preRequestScript: request.preRequestScript || '',
          postRequestScript: request.postRequestScript || '',
          testScript: request.testScript || '',
          flavors: request.flavors || [],
          variables: request.variables || [],
          dependsOn: request.dependsOn || undefined,
          response: request.response,
          description: request.description || '',
          isJsonRpc: request.isJsonRpc,
          isWebSocket: request.isWebSocket
        };
        const responseStore = useResponseStore();
        responseStore.setResponse(request.response || null);
        this.requestHeaders = request.headers ? request.headers.map(h => ({ ...h, enabled: h.enabled !== false })) : [];
        this.urlParams = this.extractParams(request.url || '');
        const appStore = useAppStore();
        appStore.saveToLocalStorage();
      }
    }
  }
});