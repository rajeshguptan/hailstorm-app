import { contextBridge } from 'electron';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

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

const trpcClient = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://127.0.0.1:3001/trpc',
    }),
  ],
});

const api = {
  makeRequest: async (options: RequestOptions): Promise<ResponseData> => {
    console.log('[PRELOAD] makeRequest called', { method: options.method, url: options.url });
    try {
      const result = await trpcClient.makeRequest.mutate(options);
      console.log('[PRELOAD] makeRequest succeeded', { status: result.status });
      return result;
    } catch (error) {
      console.error('[PRELOAD] makeRequest failed', error);
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
