import type { SendRequestContext, SendRequestResult, RunConfig } from '../types';
import { sendRequest } from './executionEngine';

interface RunnerOptions {
  threadCount?: number;
  maxQueueSize?: number;
}

const flatRequests = (items: any[]): Map<string, any> => {
  const map = new Map<string, any>();
  for (const item of items) {
    if (item && item.method && item.url) {
      map.set(item.id, item);
    }
    if (item && item.items && Array.isArray(item.items)) {
      flatRequests(item.items).forEach((v, k) => map.set(k, v));
    }
  }
  return map;
};

/**
 * RunnerEngine - Deep module for request execution and load testing
 *
 * Designed to run in the main process. Use the IPC handlers in executionEngine
 * to invoke from the renderer.
 */
export class RunnerEngine {
  private running = false;

  constructor(options: RunnerOptions = {}) {
    console.log('[RUNNER_ENGINE] Initialized (main process only)');
  }

/**
    * Execute a single request through the execution engine.
    */
  async executeRequest(context: SendRequestContext, rps: number = 0, requestId: string = ''): Promise<SendRequestResult> {
    return sendRequest(context, rps, requestId);
  }

  /**
   * Execute a load test with the given configuration.
   * Integrates with loadTestStore for request recording.
   */
async executeLoadTest(
     config: RunConfig,
     collections: any[],
     environments: any[],
     secrets: Array<{ id: string; name: string; env: string; value: string }> = [],
     isSecretsUnlocked: boolean = false,
     requestConfigs?: Record<string, { rps: number; datafile?: string }>,
     onRequestComplete?: (result: any) => Promise<void> | void
   ): Promise<void> {
    this.running = true;

    const collection = collections.find((c: any) => c.id === config.collectionId);
    if (!collection) {
      throw new Error(`Collection ${config.collectionId} not found`);
    }

    const requestMap = flatRequests(collection.items);
    const requests = config.selectedRequests
      .map((id: string) => requestMap.get(id))
      .filter((req: any) => req && req.method);

    if (requests.length === 0) {
      this.running = false;
      return;
    }

    console.log('[RUNNER_ENGINE] Starting load test with', requests.length, 'requests');

    const startTime = Date.now();
    const durationMs = (config.duration || 0) * 1000; // Duration is in seconds, convert to ms
    let iterations = 0;

    while (this.running) {
      const elapsed = Date.now() - startTime;
      
      // Check if duration has been exceeded (if duration > 0)
      if (durationMs > 0 && elapsed >= durationMs) {
        console.log(`[RUNNER_ENGINE] Duration of ${durationMs}ms reached after ${iterations} iterations`);
        break;
      }

      for (const request of requests) {
        if (!this.running) break;

        try {
          const rpsConfig = requestConfigs?.[request.id]?.rps || 0;
          const result = await this.executeSingleRequest(request, environments, collections, secrets, isSecretsUnlocked, rpsConfig);
          if (onRequestComplete) {
            await onRequestComplete(result);
          }
        } catch (error) {
          console.error('[RUNNER_ENGINE] Request failed:', error);
        }
      }
      
      iterations++;
    }

    this.running = false;
    console.log(`[RUNNER_ENGINE] Load test completed after ${iterations} iterations`);
  }

  /**
   * Execute a single request with full context including secrets.
   */
async executeSingleRequest(
     request: any,
     environments: any[],
     collections: any[],
     secrets: Array<{ id: string; name: string; env: string; value: string }>,
     isSecretsUnlocked: boolean,
     rps: number = 0
   ): Promise<any> {
     const activeEnv = environments.find((e: any) => e.active);
     const requestMap = flatRequests(collections.flatMap((c: any) => c.items || []));

     const context: SendRequestContext = {
       requestsStore: {
         currentRequest: request,
         requestHeaders: request.headers || [],
         urlParams: [],
         activeRequestTab: 'body',
       },
       responseStore: {
         response: null,
         testResults: '',
         activeResponseTab: 'body',
         isLoading: false,
       },
       historyStore: { history: [] },
       environmentsStore: {
         environments,
         activeEnvironmentId: activeEnv?.id || null,
       },
       appStore: {
         secrets,
         selectedSecretId: null,
       },
       collectionsStore: {
         collections,
         selectedCollectionId: null,
       },
       secretsStore: {
         isUnlocked: isSecretsUnlocked,
       },
     };

     const result = await this.executeRequest(context, rps, request.id);

    return {
      status: result.response.status,
      statusText: result.response.statusText,
      time: result.response.time,
      error: result.response.error,
      requestName: request.name,
      method: request.method,
    };
  }

  stop() {
    this.running = false;
  }
}

// Export for use in main process
export { flatRequests };