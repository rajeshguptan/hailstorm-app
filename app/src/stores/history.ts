import { defineStore } from 'pinia';
import type { HistoryItem } from '../types';
import { useAppStore } from './';
import { useRequestsStore } from './requests';
import { useResponseStore } from './response';

export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: [] as HistoryItem[],
  }),

  actions: {
    addToHistory(item: HistoryItem) {
      this.history.unshift(item);
      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100);
      }
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    clearHistory() {
      this.history = [];
      const appStore = useAppStore();
      appStore.saveToLocalStorage();
    },

    loadFromHistory(item: HistoryItem) {
      console.log('[HISTORY] loadFromHistory called with item:', item);
      const requestsStore = useRequestsStore();
      const responseStore = useResponseStore();

      console.log('[HISTORY] Current request before:', requestsStore.currentRequest);
      console.log('[HISTORY] Current response before:', responseStore.response);

      // Load the request into the current request state with defaults
      const newRequest = {
        id: item.request.id || '',
        name: item.request.name || 'History Request',
        method: item.request.method || 'GET',
        url: item.request.url || '',
        headers: item.request.headers || [],
        body: item.request.body || { type: 'none', content: '' },
        auth: item.request.auth || { type: 'noauth', apikey: { key: '', value: '', in: 'header' } },
        preRequestScript: item.request.preRequestScript || '',
        testScript: item.request.testScript || '',
        flavors: item.request.flavors || [],
        variables: item.request.variables || [],
        response: item.response
      };

      requestsStore.currentRequest = newRequest;
      requestsStore.selectedRequestId = item.request.id || 'history-item'; // Set selectedRequestId to show the request panel
      requestsStore.urlParams = requestsStore.extractParams(item.request.url || '');
      requestsStore.requestHeaders = item.request.headers ? [...item.request.headers] : [];
      requestsStore.activeRequestTab = 'params'; // Reset to params tab

      // Load the response
      responseStore.response = item.response;
      responseStore.activeResponseTab = 'body';

      console.log('[HISTORY] New request set:', requestsStore.currentRequest);
      console.log('[HISTORY] New response set:', responseStore.response);
      console.log('[HISTORY] selectedRequestId set to:', requestsStore.selectedRequestId);
      console.log('[HISTORY] loadFromHistory completed');
    }
  }
});