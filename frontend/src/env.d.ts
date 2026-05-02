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
      runShell: (command: { command: string }) => Promise<{ output: string; error: string }>;
      importCollection: () => Promise<string | null>;
      importEnvironment: () => Promise<string | null>;
      selectWorkspace: () => Promise<string | null>;
      saveCollectionToFiles: (collection: any, workspacePath: string) => Promise<boolean>;
      loadCollectionFromFiles: (collectionName: string, workspacePath: string) => Promise<any>;
      initializeLoadTesting: () => Promise<void>;
      startLoadTestRun: (runConfig: any) => Promise<any>;
      recordLoadTestRequest: (runId: string, requestData: any) => Promise<void>;
      endLoadTestRun: (runId: string) => Promise<any>;
      getLoadTestRunStats: (runId: string) => Promise<any>;
      getLoadTestTimeSeriesData: (runId: string, startTime?: number, endTime?: number) => Promise<any[]>;
      exportLoadTestRunData: (runId: string, format?: string) => Promise<string>;
      getCompletedLoadTestRuns: () => Promise<any[]>;
      deleteLoadTestRun: (runId: string) => Promise<void>;
      exportSecretsDialog: (secretsData: string) => Promise<string | null>;
      importSecretsDialog: () => Promise<{ filePath: string; content: string } | null>;
    };
  }
