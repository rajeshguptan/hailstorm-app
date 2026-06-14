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

export interface SendRequestContext {
  requestsStore: Record<string, unknown>;
  responseStore: Record<string, unknown>;
  historyStore: Record<string, unknown>;
  environmentsStore: Record<string, unknown>;
  appStore: Record<string, unknown>;
  collectionsStore?: Record<string, unknown>;
  secretsStore?: Record<string, unknown>;
}

export interface SendRequestResult {
  response: {
    status: number;
    statusText: string;
    data: string;
    time: number;
    headers: Record<string, string | string[]>;
    error?: string;
  };
  substitutedRequest: unknown;
  executedDependencies: { id: string; name: string; status: number; statusText: string; time: number; error?: string }[];
  historyEntries: unknown[];
  testResults: string;
  scriptSource?: string;
}

export type RunLoadTestParams = {
  config: any;
  collections: any[];
  environments: any[];
  secrets: any[];
  isSecretsUnlocked: boolean;
  runId?: string; // Optional existing runId to continue recording to
};

const api = {
  makeRequest: async (options: import('./types').RequestOptions): Promise<import('./types').ResponseData> => {
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

  showOpenDialog: async (options: { filters?: { name: string; extensions: string[] }[] }): Promise<{ canceled: boolean; filePaths: string[] }> => {
    console.log('[PRELOAD] showOpenDialog called');
    try {
      const result = await ipcRenderer.invoke('show-open-dialog', options.filters);
      console.log('[PRELOAD] showOpenDialog result:', result.canceled ? 'cancelled' : 'selected file');
      return result;
    } catch (error) {
      console.error('[PRELOAD] showOpenDialog failed', error);
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

  getLoadTestTimeSeriesDataByRequest: async (runId: string, startTime?: number, endTime?: number): Promise<any[]> => {
    try {
      const result = await ipcRenderer.invoke('get-load-test-time-series-data-by-request', runId, startTime, endTime);
      return result;
    } catch (error) {
      console.error('[PRELOAD] getLoadTestTimeSeriesDataByRequest failed', error);
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

  showOpenDialog: async (options: any): Promise<{ canceled: boolean; filePaths: string[] }> => {
    console.log('[PRELOAD] showOpenDialog called');
    try {
      const result = await ipcRenderer.invoke('select-datafile-dialog', options.filters);
      console.log('[PRELOAD] showOpenDialog result:', result.canceled ? 'cancelled' : 'selected file');
      return result;
    } catch (error) {
      console.error('[PRELOAD] showOpenDialog failed', error);
      throw error;
    }
  },

  selectCertificateFileDialog: async (type: 'pfx' | 'pem'): Promise<{ canceled: boolean; filePaths: string[] }> => {
    console.log('[PRELOAD] selectCertificateFileDialog called', type);
    try {
      const filters = type === 'pfx'
        ? [{ name: 'PKCS#12 Certificates', extensions: ['pfx', 'p12'] }, { name: 'All Files', extensions: ['*'] }]
        : [{ name: 'PEM Certificates', extensions: ['pem', 'crt', 'key'] }, { name: 'All Files', extensions: ['*'] }];
      const result = await ipcRenderer.invoke('select-certificate-file-dialog', filters);
      console.log('[PRELOAD] selectCertificateFileDialog result:', result.canceled ? 'cancelled' : 'selected file');
      return result;
    } catch (error) {
      console.error('[PRELOAD] selectCertificateFileDialog failed', error);
      throw error;
    }
  },

  // ─── Send Request via execution engine ───────────────────────────────────
  // The execution engine handles variable substitution, dependency resolution,
  // header/auth construction, the actual HTTP call and history recording.
  // All that is delegated from the renderer through this IPC bridge.
  sendRequest: async (context: SendRequestContext): Promise<SendRequestResult> => {
    console.log('[PRELOAD] sendRequest called');
    try {
      const result = await ipcRenderer.invoke('send-request', context);
      console.log('[PRELOAD] sendRequest completed', { status: result.response.status });
      return result;
    } catch (error) {
console.error('[PRELOAD] sendRequest failed', error);
      throw error;
    }
  },

  // ─── OAuth 2.0 Authorization Code Flow with PKCE ───────────────────────────────
  storeOAuthState: async (state: { state: string; codeVerifier: string }): Promise<void> => {
    await ipcRenderer.invoke('store-oauth-state', state);
  },

  exchangeOAuthCode: async (code: string, config: {
    tokenUrl: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    state?: string;
  }): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> => {
    // Retrieve codeVerifier from stored state if state is provided
    let codeVerifier: string | undefined;
    if (config.state) {
      codeVerifier = await ipcRenderer.invoke('get-oauth-state', config.state);
    }
    return await ipcRenderer.invoke('exchange-oauth-code', { code, codeVerifier, ...config });
  },

  getOAuthToken: async (requestId: string): Promise<string | null> => {
    return await ipcRenderer.invoke('get-oauth-token', requestId);
  },

  openExternal: async (url: string): Promise<void> => {
    await ipcRenderer.invoke('open-external-url', url);
  },

  // ─── OAuth Token Management ───────────────────────────────────────────────────
  saveOAuthToken: async (requestId: string, token: string, expiry?: number): Promise<void> => {
    await ipcRenderer.invoke('save-oauth-token', { requestId, token, expiry });
  },

  clearOAuthToken: async (requestId: string): Promise<void> => {
    await ipcRenderer.invoke('clear-oauth-token', requestId);
  },

  // ─── OAuth Callback Listener ───────────────────────────────────────────────────
  onOAuthCallback: (callback: (data: { code: string; state: string; error?: string }) => void) => {
    ipcRenderer.on('oauth-callback', (_event, data) => callback(data));
  },

  // ─── Run Load Test via IPC ───────────────────────────────────────────────
  // Delegates load test execution to the main process through executionEngine.
  runLoadTest: async (params: RunLoadTestParams): Promise<any[]> => {
    console.log('[PRELOAD] runLoadTest called');
    try {
      const result = await ipcRenderer.invoke('run-load-test', params);
      console.log('[PRELOAD] runLoadTest completed');
      return result;
    } catch (error) {
      console.error('[PRELOAD] runLoadTest failed', error);
      throw error;
    }
  },

  // Stop the running load test
  stopLoadTest: async (): Promise<void> => {
    console.log('[PRELOAD] stopLoadTest called');
    try {
      await ipcRenderer.invoke('stop-load-test');
      console.log('[PRELOAD] stopLoadTest completed');
    } catch (error) {
      console.error('[PRELOAD] stopLoadTest failed', error);
      throw error;
    }
  },

  // Subscribe to live stats updates during load test
  onLoadTestStatsUpdate: (callback: (data: { runId: string; stats: any }) => void) => {
    ipcRenderer.on('load-test-stats-update', (_event, data) => callback(data));
  }
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: typeof api;
  }
}
