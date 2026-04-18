declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface RequestOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: string;
  time: number;
  error?: string;
}

interface Window {
  api: {
    makeRequest: (options: RequestOptions) => Promise<ResponseData>;
  };
}
