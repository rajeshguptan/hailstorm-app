import { contextBridge, ipcRenderer } from 'electron';

console.log('[PRELOAD] Preload script loaded');

export interface RequestOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: string;
  time: number;
  error?: string;
}

const api = {
  makeRequest: async (options: RequestOptions): Promise<ResponseData> => {
    console.log('[PRELOAD] makeRequest called', { method: options.method, url: options.url });
    try {
      const result = await ipcRenderer.invoke('make-request', options);
      console.log('[PRELOAD] makeRequest succeeded', { status: result.status });
      return result;
    } catch (error) {
      console.error('[PRELOAD] makeRequest failed', error);
      throw error;
    }
  },
  runShell: async (command: string): Promise<{ output: string; error: string }> => {
    console.log('[PRELOAD] runShell called', { command });
    try {
      const result = await ipcRenderer.invoke('run-shell', command);
      console.log('[PRELOAD] runShell succeeded');
      return result;
    } catch (error) {
      console.error('[PRELOAD] runShell failed', error);
      throw error;
    }
  },
  importCollection: async (): Promise<string | null> => {
    console.log('[PRELOAD] importCollection called');
    try {
      const result = await ipcRenderer.invoke('import-collection');
      console.log('[PRELOAD] importCollection result', result ? 'received content' : 'canceled');
      return result;
    } catch (error) {
      console.error('[PRELOAD] importCollection failed', error);
      throw error;
    }
  },
  importEnvironment: async (): Promise<string | null> => {
    console.log('[PRELOAD] importEnvironment called');
    try {
      const result = await ipcRenderer.invoke('import-environment');
      console.log('[PRELOAD] importEnvironment result', result ? 'received content' : 'canceled');
      return result;
    } catch (error) {
      console.error('[PRELOAD] importEnvironment failed', error);
      throw error;
    }
  },

  selectWorkspace: async (): Promise<string | null> => {
    console.log('[PRELOAD] selectWorkspace called');
    try {
      const result = await ipcRenderer.invoke('select-workspace');
      console.log('[PRELOAD] selectWorkspace result', result ? 'selected path' : 'canceled');
      return result;
    } catch (error) {
      console.error('[PRELOAD] selectWorkspace failed', error);
      throw error;
    }
  },

  saveCollectionToFiles: async (collection: any, workspacePath: string): Promise<boolean> => {
    console.log('[PRELOAD] saveCollectionToFiles called');
    try {
      const result = await ipcRenderer.invoke('save-collection-to-files', collection, workspacePath);
      console.log('[PRELOAD] saveCollectionToFiles result:', result);
      return result;
    } catch (error) {
      console.error('[PRELOAD] saveCollectionToFiles failed', error);
      throw error;
    }
  },

  loadCollectionFromFiles: async (collectionName: string, workspacePath: string): Promise<any> => {
    console.log('[PRELOAD] loadCollectionFromFiles called');
    try {
      const result = await ipcRenderer.invoke('load-collection-from-files', collectionName, workspacePath);
      console.log('[PRELOAD] loadCollectionFromFiles result:', result ? 'loaded collection' : 'failed');
      return result;
    } catch (error) {
      console.error('[PRELOAD] loadCollectionFromFiles failed', error);
      throw error;
    }
  },

  // Load Testing API
  initializeLoadTesting: async (): Promise<void> => {
    console.log('[PRELOAD] initializeLoadTesting called');
    try {
      await ipcRenderer.invoke('initialize-load-testing');
      console.log('[PRELOAD] initializeLoadTesting succeeded');
    } catch (error) {
      console.error('[PRELOAD] initializeLoadTesting failed', error);
      throw error;
    }
  },

  startLoadTestRun: async (runConfig: any): Promise<any> => {
    console.log('[PRELOAD] startLoadTestRun called');
    try {
      const result = await ipcRenderer.invoke('start-load-test-run', runConfig);
      console.log('[PRELOAD] startLoadTestRun succeeded');
      return result;
    } catch (error) {
      console.error('[PRELOAD] startLoadTestRun failed', error);
      throw error;
    }
  },

  recordLoadTestRequest: async (runId: string, requestData: any): Promise<void> => {
    try {
      await ipcRenderer.invoke('record-load-test-request', runId, requestData);
    } catch (error) {
      console.error('[PRELOAD] recordLoadTestRequest failed', error);
      throw error;
    }
  },

  endLoadTestRun: async (runId: string): Promise<any> => {
    console.log('[PRELOAD] endLoadTestRun called');
    try {
      const result = await ipcRenderer.invoke('end-load-test-run', runId);
      console.log('[PRELOAD] endLoadTestRun succeeded');
      return result;
    } catch (error) {
      console.error('[PRELOAD] endLoadTestRun failed', error);
      throw error;
    }
  },

  getLoadTestRunStats: async (runId: string): Promise<any> => {
    try {
      const result = await ipcRenderer.invoke('get-load-test-run-stats', runId);
      return result;
    } catch (error) {
      console.error('[PRELOAD] getLoadTestRunStats failed', error);
      throw error;
    }
  },

  getLoadTestTimeSeriesData: async (runId: string, startTime?: number, endTime?: number): Promise<any[]> => {
    try {
      const result = await ipcRenderer.invoke('get-load-test-time-series-data', runId, startTime, endTime);
      return result;
    } catch (error) {
      console.error('[PRELOAD] getLoadTestTimeSeriesData failed', error);
      throw error;
    }
  },

  exportLoadTestRunData: async (runId: string, format?: string): Promise<string> => {
    console.log('[PRELOAD] exportLoadTestRunData called');
    try {
      const result = await ipcRenderer.invoke('export-load-test-run-data', runId, format);
      console.log('[PRELOAD] exportLoadTestRunData succeeded');
      return result;
    } catch (error) {
      console.error('[PRELOAD] exportLoadTestRunData failed', error);
      throw error;
    }
  },

  getCompletedLoadTestRuns: async (): Promise<any[]> => {
    try {
      const result = await ipcRenderer.invoke('get-completed-load-test-runs');
      return result;
    } catch (error) {
      console.error('[PRELOAD] getCompletedLoadTestRuns failed', error);
      throw error;
    }
  },

  deleteLoadTestRun: async (runId: string): Promise<void> => {
    console.log('[PRELOAD] deleteLoadTestRun called');
    try {
      await ipcRenderer.invoke('delete-load-test-run', runId);
      console.log('[PRELOAD] deleteLoadTestRun succeeded');
    } catch (error) {
      console.error('[PRELOAD] deleteLoadTestRun failed', error);
      throw error;
    }
  },

  // Secrets Import/Export with file path selection
  exportSecretsDialog: async (secretsData: string): Promise<string | null> => {
    console.log('[PRELOAD] exportSecretsDialog called');
    try {
      const result = await ipcRenderer.invoke('export-secrets-dialog', secretsData);
      console.log('[PRELOAD] exportSecretsDialog result:', result);
      return result;
    } catch (error) {
      console.error('[PRELOAD] exportSecretsDialog failed', error);
      throw error;
    }
  },

  importSecretsDialog: async (): Promise<{ filePath: string; content: string } | null> => {
    console.log('[PRELOAD] importSecretsDialog called');
    try {
      const result = await ipcRenderer.invoke('import-secrets-dialog');
      console.log('[PRELOAD] importSecretsDialog result:', result ? 'file loaded' : 'cancelled');
      return result;
    } catch (error) {
      console.error('[PRELOAD] importSecretsDialog failed', error);
      throw error;
    }
  },
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: typeof api;
  }
}
