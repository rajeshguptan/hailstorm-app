import type { LoadTestStats } from '../types';

export interface OtelExporterConfig {
  enabled: boolean;
  endpoint: string;
  userId: string;
}

export interface LoadTestTrace {
  runId: string;
  runName: string;
  userId: string;
  startTime: number;
  endTime: number;
  stats: LoadTestStats;
}

export class OpenTelemetryExporter {
   public config: OtelExporterConfig;

   constructor(config: OtelExporterConfig) {
     this.config = config;
   }

   updateConfig(config: OtelExporterConfig) {
     this.config = config;
   }

  async exportTrace(
    trace: LoadTestTrace,
    secretResolver?: (ref: string) => Promise<string | null>
  ): Promise<void> {
    if (!this.config.enabled || !this.config.endpoint) {
      return;
    }

    try {
      let resolvedUserId = this.config.userId;
      if (secretResolver && this.config.userId && this.config.userId.includes('{{')) {
        const match = this.config.userId.match(/\{\{([a-zA-Z0-9_.-]+)\}\}/);
        if (match) {
          const value = await secretResolver(match[1]);
          if (value) resolvedUserId = value;
        }
      }

      const payload = {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'hailstorm-runner' } },
            { key: 'user.id', value: { stringValue: resolvedUserId || 'unknown' } },
          ]
        },
        instrumentationLibrarySpans: [{
          instrumentationLibrary: { name: 'hailstorm', version: '1.0.0' },
          spans: [{
            traceId: this.generateTraceId(),
            spanId: this.generateSpanId(),
            parentSpanId: '',
            name: `Load Test: ${trace.runName}`,
            kind: 'SPAN_KIND_SERVER',
            startTimeUnixNano: trace.startTime * 1000000,
            endTimeUnixNano: trace.endTime * 1000000,
            attributes: [
              { key: 'run.id', value: { stringValue: trace.runId } },
              { key: 'run.name', value: { stringValue: trace.runName } },
              { key: 'total.requests', value: { intValue: `${trace.stats.totalRequests || 0}` } },
              { key: 'successful.requests', value: { intValue: `${trace.stats.successfulRequests || 0}` } },
              { key: 'failed.requests', value: { intValue: `${trace.stats.failedRequests || 0}` } },
              { key: 'error.rate', value: { doubleValue: trace.stats.errorRate || 0 } },
              { key: 'avg.response.time', value: { doubleValue: trace.stats.avgResponseTime || 0 } },
              { key: 'min.response.time', value: { intValue: `${trace.stats.minResponseTime || 0}` } },
              { key: 'max.response.time', value: { intValue: `${trace.stats.maxResponseTime || 0}` } },
              { key: 'p50.response.time', value: { doubleValue: trace.stats.p50ResponseTime || 0 } },
              { key: 'p75.response.time', value: { doubleValue: trace.stats.p75ResponseTime || 0 } },
              { key: 'p90.response.time', value: { doubleValue: trace.stats.p90ResponseTime || 0 } },
              { key: 'p95.response.time', value: { doubleValue: trace.stats.p95ResponseTime || 0 } },
              { key: 'p99.response.time', value: { doubleValue: trace.stats.p99ResponseTime || 0 } },
              { key: 'duration.ms', value: { intValue: `${trace.stats.duration || 0}` } },
              { key: 'requests.per.second', value: { doubleValue: trace.stats.requestsPerSecond || 0 } },
            ],
            status: { code: trace.stats.failedRequests > 0 ? 'STATUS_CODE_ERROR' : 'STATUS_CODE_OK' }
          }]
        }]
      };

      await fetch(`${this.config.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[OTEL_EXPORTER] Failed to export trace:', error);
    }
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

export const otelExporter = new OpenTelemetryExporter({
  enabled: false,
  endpoint: '',
  userId: '',
});