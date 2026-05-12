import { defineStore } from 'pinia';
import type {
  LoadTestRun,
  LoadTestRunMetrics,
  LoadTestRequestIndex,
  LoadTestDetailChunk,
  LoadTestRequestDetail,
  LoadTestStats,
  LoadTestTimeSeriesPoint,
  LoadTestTimeSeriesByRequestPoint
} from '../types';

export const useLoadTestStore = defineStore('loadTest', {
  state: () => ({
    currentRun: null as LoadTestRun | null,
    isInitialized: false,
    liveStats: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      requestsPerSecond: 0,
      startTime: 0,
      recentRequests: [] as LoadTestTimeSeriesPoint[]
    },
    // In-memory rolling window for live charts (last 5 minutes)
    rollingWindowData: [] as { timestamp: number; requests: number; errors: number; responseTimes: number[] }[],
    rollingWindowByRequestData: {} as { [requestName: string]: { timestamp: number; requests: number; errors: number; responseTimes: number[] }[] },
    maxRollingWindowSize: 300, // 5 minutes at 1 second resolution
  }),

  getters: {

    // Convert rolling window data to LoadTestTimeSeriesPoint format
    rollingWindow(): LoadTestTimeSeriesPoint[] {
      return this.rollingWindowData.map(point => {
        const percentiles = this.calculatePercentiles(point.responseTimes);
        return {
          timestamp: point.timestamp,
          requests: point.requests,
          errors: point.errors,
          avgResponseTime: percentiles.mean,
          p50ResponseTime: percentiles.p50,
          p75ResponseTime: percentiles.p75,
          p90ResponseTime: percentiles.p90,
          p95ResponseTime: percentiles.p95,
          p99ResponseTime: percentiles.p99
        };
      });
    },

    // Convert by-request rolling window data
    rollingWindowByRequest(): { [requestName: string]: LoadTestTimeSeriesPoint[] } {
      const result: { [requestName: string]: LoadTestTimeSeriesPoint[] } = {};

      for (const [requestName, points] of Object.entries(this.rollingWindowByRequestData)) {
        result[requestName] = points.map(point => {
          const percentiles = this.calculatePercentiles(point.responseTimes);
          return {
            timestamp: point.timestamp,
            requests: point.requests,
            errors: point.errors,
            avgResponseTime: percentiles.mean,
            p50ResponseTime: percentiles.p50,
            p75ResponseTime: percentiles.p75,
            p90ResponseTime: percentiles.p90,
            p95ResponseTime: percentiles.p95,
            p99ResponseTime: percentiles.p99
          };
        });
      }

      return result;
    }
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return;

      try {
        // Initialize load testing system in main process
        await window.api.initializeLoadTesting();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize load testing:', error);
        // Don't set isInitialized to true if it failed
        throw error;
      }
    },

    // Calculate percentiles from response times
    calculatePercentiles(responseTimes: number[]): { p50: number; p75: number; p90: number; p95: number; p99: number; mean: number } {
      if (responseTimes.length === 0) {
        return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0 };
      }

      const sorted = [...responseTimes].sort((a, b) => a - b);
      const len = sorted.length;

      const percentile = (p: number) => {
        const index = (p / 100) * (len - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;

        if (upper >= len) return sorted[len - 1];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
      };

      const mean = responseTimes.reduce((a, b) => a + b, 0) / len;

      return {
        mean,
        p50: percentile(50),
        p75: percentile(75),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99)
      };
    },

    async startRun(runConfig: Omit<LoadTestRun, 'id' | 'startTime' | 'status' | 'totalRequests' | 'completedRequests' | 'failedRequests'>) {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Serialize the config to remove Proxy objects before IPC
      const serializedConfig = JSON.parse(JSON.stringify(runConfig));
      const run = await window.api.startLoadTestRun(serializedConfig);

      this.currentRun = run;

      // Reset live stats
      this.liveStats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        requestsPerSecond: 0,
        startTime: run.startTime,
        recentRequests: []
      };
      this.rollingWindowData = [];
      this.rollingWindowByRequestData = {};

      return run;
    },

    async recordRequest(requestData: {
      requestId: string;
      requestName: string;
      method: string;
      url: string;
      status: number;
      latency: number;
      responseSize: number;
      timestamp: number;
      requestDetail?: LoadTestRequestDetail;
      shouldCaptureFullDetail?: boolean;
    }) {
      if (!this.currentRun) return;

      const isError = requestData.status >= 500;

      // Record request in main process (serialize to avoid Proxy objects)
      const serializedRequestData = JSON.parse(JSON.stringify(requestData));
      await window.api.recordLoadTestRequest(this.currentRun.id, serializedRequestData);

      // Update run counters
      this.currentRun.totalRequests++;
      if (isError) {
        this.currentRun.failedRequests++;
      } else {
        this.currentRun.completedRequests++;
      }

      // Update live stats
      this.liveStats.totalRequests++;
      if (isError) {
        this.liveStats.failedRequests++;
      } else {
        this.liveStats.successfulRequests++;
      }

      const totalTime = this.liveStats.totalRequests > 0 ? this.liveStats.totalRequests : 1;
      this.liveStats.avgResponseTime =
        (this.liveStats.avgResponseTime * (totalTime - 1) + requestData.latency) / totalTime;

      // Update requests per second
      const elapsedSeconds = (Date.now() - this.liveStats.startTime) / 1000;
      this.liveStats.requestsPerSecond = elapsedSeconds > 0 ? this.liveStats.totalRequests / elapsedSeconds : 0;

      // Add to rolling window for live charts
      this.updateRollingWindow(requestData.timestamp, requestData.latency, isError, requestData.requestName);
    },

    async storeRequestDetail(requestIndexId: string, detail: LoadTestRequestDetail) {
      if (!this.currentRun) return;

      // Batch details and write to compressed file periodically
      const runDir = path.join(this.dataDir, this.currentRun.id);
      if (!fs.existsSync(runDir)) {
        fs.mkdirSync(runDir, { recursive: true });
      }

      // For now, store in individual files. In production, you'd batch these.
      const detailFile = path.join(runDir, `${requestIndexId}.json.gz`);
      const detailData = JSON.stringify(detail) + '\n';

      const compressed = zlib.gzipSync(Buffer.from(detailData));
      fs.writeFileSync(detailFile, compressed);

      // Update detail chunk metadata
      const chunkId = this.generateId('chunk');
      const chunkStmt = this.db!.prepare(`
        INSERT INTO detail_chunks (id, runId, filePath, startSequence, endSequence, recordCount, compressedSize, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      chunkStmt.run(
        chunkId,
        this.currentRun.id,
        detailFile,
        this.currentRun.totalRequests,
        this.currentRun.totalRequests,
        1,
        compressed.length,
        Date.now()
      );

      // Update request index with chunk reference
      const updateStmt = this.db!.prepare(`
        UPDATE request_index SET detailChunkId = ? WHERE id = ?
      `);
      updateStmt.run(chunkId, requestIndexId);
    },

    updateRollingWindow(timestamp: number, latency: number, isError: boolean, requestName: string) {
      const bucketTimestamp = Math.floor(timestamp / 1000) * 1000; // 1-second buckets

      // Update aggregated rolling window
      let existingPoint = this.rollingWindowData.find(p => p.timestamp === bucketTimestamp);
      if (!existingPoint) {
        existingPoint = {
          timestamp: bucketTimestamp,
          requests: 0,
          errors: 0,
          responseTimes: []
        };
        this.rollingWindowData.push(existingPoint);

        // Keep only last 5 minutes
        if (this.rollingWindowData.length > this.maxRollingWindowSize) {
          this.rollingWindowData.shift();
        }
      }

      existingPoint.requests++;
      if (isError) existingPoint.errors++;
      existingPoint.responseTimes.push(latency);

      // Keep only last 100 response times per bucket for memory efficiency
      if (existingPoint.responseTimes.length > 100) {
        existingPoint.responseTimes.shift();
      }

      // Update per-request rolling window
      if (!this.rollingWindowByRequestData[requestName]) {
        this.rollingWindowByRequestData[requestName] = [];
      }

      let existingPointByRequest = this.rollingWindowByRequestData[requestName].find(p => p.timestamp === bucketTimestamp);
      if (!existingPointByRequest) {
        existingPointByRequest = {
          timestamp: bucketTimestamp,
          requests: 0,
          errors: 0,
          responseTimes: []
        };
        this.rollingWindowByRequestData[requestName].push(existingPointByRequest);

        // Keep only last 5 minutes
        if (this.rollingWindowByRequestData[requestName].length > this.maxRollingWindowSize) {
          this.rollingWindowByRequestData[requestName].shift();
        }
      }

      existingPointByRequest.requests++;
      if (isError) existingPointByRequest.errors++;
      existingPointByRequest.responseTimes.push(latency);

      // Keep only last 100 response times per bucket for memory efficiency
      if (existingPointByRequest.responseTimes.length > 100) {
        existingPointByRequest.responseTimes.shift();
      }
    },

    updateMetrics() {
      if (!this.currentRun || !this.db) return;

      // Calculate metrics for the last minute
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      const metricsStmt = this.db.prepare(`
        SELECT
          COUNT(*) as requestCount,
          SUM(CASE WHEN error = 1 THEN 1 ELSE 0 END) as errorCount,
          AVG(latency) as avgResponseTime,
          MIN(latency) as minResponseTime,
          MAX(latency) as maxResponseTime
        FROM request_index
        WHERE runId = ? AND timestamp >= ?
      `);

      const metrics = metricsStmt.get(this.currentRun.id, oneMinuteAgo) as any;

      if (metrics.requestCount > 0) {
        // Calculate percentiles (simplified)
        const percentilesStmt = this.db.prepare(`
          SELECT latency
          FROM request_index
          WHERE runId = ? AND timestamp >= ?
          ORDER BY latency
        `);

        const latencies = percentilesStmt.all(this.currentRun.id, oneMinuteAgo) as any[];
        const p50 = this.calculatePercentile(latencies.map(l => l.latency), 50);
        const p95 = this.calculatePercentile(latencies.map(l => l.latency), 95);
        const p99 = this.calculatePercentile(latencies.map(l => l.latency), 99);

        // Insert/update metrics
        const upsertStmt = this.db.prepare(`
          INSERT OR REPLACE INTO run_metrics
          (runId, timeBucket, bucketSize, requestCount, errorCount, avgResponseTime, minResponseTime, maxResponseTime, p50ResponseTime, p95ResponseTime, p99ResponseTime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const timeBucket = Math.floor(now / 60000) * 60000; // 1-minute buckets
        upsertStmt.run(
          this.currentRun.id,
          timeBucket,
          60, // 60 seconds
          metrics.requestCount,
          metrics.errorCount,
          metrics.avgResponseTime,
          metrics.minResponseTime,
          metrics.maxResponseTime,
          p50,
          p95,
          p99
        );
      }
    },

    calculatePercentile(sortedArray: number[], percentile: number): number {
      if (sortedArray.length === 0) return 0;
      const index = (percentile / 100) * (sortedArray.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index % 1;

      if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
      return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    },

    async endRun() {
      if (!this.currentRun) return;

      const completedRun = await window.api.endLoadTestRun(this.currentRun.id);
      this.currentRun = null;

      return completedRun;
    },

    async getRunStats(runId: string): Promise<LoadTestStats | null> {
      return await window.api.getLoadTestRunStats(runId);
    },

  async getTimeSeriesData(runId: string, startTime?: number, endTime?: number): Promise<LoadTestTimeSeriesPoint[]> {
    return await window.api.getLoadTestTimeSeriesData(runId, startTime, endTime);
  },

  async getTimeSeriesDataByRequest(runId: string, startTime?: number, endTime?: number): Promise<LoadTestTimeSeriesByRequestPoint[]> {
    return await window.api.getLoadTestTimeSeriesDataByRequest(runId, startTime, endTime);
  },

    async exportRunData(runId: string, format: 'json' | 'csv' = 'json') {
      return await window.api.exportLoadTestRunData(runId, format);
    },

    async getCompletedRuns() {
      return await window.api.getCompletedLoadTestRuns();
    },

    async deleteRun(runId: string) {
      return await window.api.deleteLoadTestRun(runId);
    }
  }
});