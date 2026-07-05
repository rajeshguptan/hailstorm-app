import type { SendRequestContext, SendRequestResult, RunConfig, LoadTestStats } from '../types';
import { sendRequest } from './requestExecutor';
import { flatRequests } from './httpExecutor';
import { otelExporter, type LoadTestTrace } from './otelExporter';
import { loadTestingService } from './loadTestingService';

interface RunnerOptions {
  threadCount?: number;
  maxQueueSize?: number;
}

/**
 * RunnerEngine - Deep module for request execution and load testing
 *
 * Designed to run in the main process. Use the IPC handlers in executionEngine
 * to invoke from the renderer.
 */
export class RunnerEngine {
   private running = false;
   private secretResolver?: (ref: string) => Promise<string | null>;

   constructor(options: RunnerOptions = {}) {
     console.log('[RUNNER_ENGINE] Initialized (main process only)');
   }

   setSecretResolver(resolver: (ref: string) => Promise<string | null>) {
     this.secretResolver = resolver;
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
     onRequestComplete?: (result: any) => Promise<void> | void,
     activeEnvironmentId?: string | null
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
      const durationMs = config.runRepeated && config.duration && config.duration > 0 ? (config.duration || 0) * 1000 : 0;
      const maxIterations = config.runRepeated ? Infinity : (config.iterations || 1);
      let iterations = 0;
      const runId = config.id;

      while (this.running && iterations < maxIterations) {
        const elapsed = Date.now() - startTime;
        
        // Check if duration has been exceeded (if duration > 0)
        if (durationMs > 0 && elapsed >= durationMs) {
          console.log(`[RUNNER_ENGINE] Duration of ${durationMs}ms reached after ${iterations} iterations`);
          this.running = false;
          break;
        }

        for (const request of requests) {
          if (!this.running) break;

          try {
            const rpsConfig = requestConfigs?.[request.id]?.rps || 0;
            const result = await this.executeSingleRequest(request, config, environments, collections, secrets, isSecretsUnlocked, rpsConfig, activeEnvironmentId);
            
            // Check duration again before callback in case request took time
            if (this.running && onRequestComplete) {
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

      // Export trace to OpenTelemetry collector if configured
      if (otelExporter.config?.enabled) {
        try {
          const stats = await loadTestingService.getRunStats(runId);
          if (stats) {
            const tracePayload: LoadTestTrace = {
              runId: config.id,
              runName: config.name || 'Unnamed Run',
              userId: otelExporter.config.userId || 'unknown',
              startTime,
              endTime: Date.now(),
              stats,
            };
            await otelExporter.exportTrace(tracePayload, this.secretResolver);
          }
        } catch (error) {
          console.error('[RUNNER_ENGINE] OTel export failed:', error);
        }
      }
    }

  /**
   * Execute a single request with full context including secrets.
   */
  async executeSingleRequest(
    request: any,
    config: RunConfig,
    environments: any[],
    collections: any[],
    secrets: Array<{ id: string; name: string; env: string; value: string }>,
    isSecretsUnlocked: boolean,
    rps: number = 0,
    activeEnvironmentId?: string | null
  ): Promise<any> {
    const activeEnv = environments.find((e: any) => e.active);
    const requestMap = flatRequests(collections.flatMap((c: any) => c.items || []));
    const requestUrl = requestMap.get(request.id)?.url || request.url;

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
        scriptSource: '',
        activeResponseTab: 'body',
        isLoading: false,
      },
      historyStore: { history: [] },
      environmentsStore: {
        environments,
        activeEnvironmentId: activeEnvironmentId ?? activeEnv?.id ?? null,
      },
      appStore: {
        secrets,
        selectedSecretId: null,
      },
      collectionsStore: {
        collections,
        selectedCollectionId: config.collectionId,
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
      requestId: request.id,
      requestName: request.name,
      method: request.method,
      url: requestUrl,
    };
  }

  stop() {
    this.running = false;
  }
}