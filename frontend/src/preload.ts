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
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: typeof api;
  }
}
