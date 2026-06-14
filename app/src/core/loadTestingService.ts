import path from 'node:path';
import fs from 'fs';
import os from 'node:os';
import * as zlib from 'zlib';
import type { LoadTestRun, LoadTestStats, LoadTestTimeSeriesPoint, LoadTestTimeSeriesByRequestPoint } from '../types';

export interface LoadTestRequestIndex {
  id: string;
  runId: string;
  requestId: string;
  requestName: string;
  method: string;
  url: string;
  urlHash: string;
  status: number;
  latency: number;
  responseSize: number;
  error: boolean;
  timestamp: number;
  detailChunkId: string;
  sequenceNumber: number;
}

export interface LoadTestDetailChunk {
  id: string;
  runId: string;
  filePath: string;
  startSequence: number;
  endSequence: number;
  recordCount: number;
  compressedSize: number;
  createdAt: number;
}

export interface LoadTestRequestDetail {
  requestIndexId: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string;
    size: number;
  };
  timestamp: number;
  latency: number;
  error?: string;
}

class LoadTestingService {
  private dataDir: string = '';
  private runs: LoadTestRun[] = [];
  private runMetrics: any[] = [];
  private requestIndex: LoadTestRequestIndex[] = [];
  private detailChunks: LoadTestDetailChunk[] = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      const userDataPath = process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'data')
        : path.join(os.homedir(), '.hailstorm');

      this.dataDir = path.join(userDataPath, 'load-tests');

      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      await this.loadData();
      this.isInitialized = true;
      console.log('[LOAD_TESTING] Initialized successfully');
    } catch (error) {
      console.error('[LOAD_TESTING] Failed to initialize:', error);
      throw error;
    }
  }

  private async loadData() {
    try {
      const runsPath = path.join(this.dataDir, 'runs.json');
      const metricsPath = path.join(this.dataDir, 'run_metrics.json');
      const indexPath = path.join(this.dataDir, 'request_index.json');
      const chunksPath = path.join(this.dataDir, 'detail_chunks.json');

      if (fs.existsSync(runsPath)) {
        this.runs = JSON.parse(fs.readFileSync(runsPath, 'utf-8'));
      }

      if (fs.existsSync(metricsPath)) {
        this.runMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
      }

      if (fs.existsSync(indexPath)) {
        this.requestIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      }

      if (fs.existsSync(chunksPath)) {
        this.detailChunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
      }
    } catch (error) {
      console.error('[LOAD_TESTING] Failed to load data:', error);
      this.runs = [];
      this.runMetrics = [];
      this.requestIndex = [];
      this.detailChunks = [];
    }
  }

  private async saveData() {
    try {
      fs.writeFileSync(path.join(this.dataDir, 'runs.json'), JSON.stringify(this.runs, null, 2));
      fs.writeFileSync(path.join(this.dataDir, 'run_metrics.json'), JSON.stringify(this.runMetrics, null, 2));
      fs.writeFileSync(path.join(this.dataDir, 'request_index.json'), JSON.stringify(this.requestIndex, null, 2));
      fs.writeFileSync(path.join(this.dataDir, 'detail_chunks.json'), JSON.stringify(this.detailChunks, null, 2));
    } catch (error) {
      console.error('[LOAD_TESTING] Failed to save data:', error);
    }
  }

  async startRun(runConfig: any): Promise<LoadTestRun> {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    const run: LoadTestRun = {
      ...runConfig,
      id: this.generateId('run'),
      startTime: Date.now(),
      status: 'running',
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0
    };

    this.runs.push(run);
    await this.saveData();
    return run;
  }

  async recordRequest(runId: string, requestData: any) {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    const isError = requestData.status >= 500;
    const sequenceNumber = this.getNextSequenceNumber(runId);
    const requestIndexId = this.generateId('req');
    const urlHash = this.hashString(requestData.url);

    const runIndex = this.runs.findIndex(r => r.id === runId);
    if (runIndex !== -1) {
      if (isError) {
        this.runs[runIndex].failedRequests++;
      } else {
        this.runs[runIndex].completedRequests++;
      }
      this.runs[runIndex].totalRequests++;
    }

    const requestRecord: LoadTestRequestIndex = {
      id: requestIndexId,
      runId,
      requestId: requestData.requestId,
      requestName: requestData.requestName,
      method: requestData.method,
      url: requestData.url,
      urlHash,
      status: requestData.status,
      latency: requestData.latency,
      responseSize: requestData.responseSize,
      error: isError,
      timestamp: requestData.timestamp,
      sequenceNumber
    };

    this.requestIndex.push(requestRecord);

    if (requestData.shouldCaptureFullDetail && requestData.requestDetail) {
      await this.storeRequestDetail(requestIndexId, runId, requestData.requestDetail);
    }

    if (sequenceNumber % 100 === 0) {
      await this.saveData();
    }
  }

  async storeRequestDetail(requestIndexId: string, runId: string, detail: any) {
    const runDir = path.join(this.dataDir, runId);
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }

    const detailFile = path.join(runDir, `${requestIndexId}.json.gz`);
    const detailData = JSON.stringify(detail) + '\n';
    const compressed = zlib.gzipSync(Buffer.from(detailData));
    fs.writeFileSync(detailFile, compressed);

    const chunkId = this.generateId('chunk');
    const chunkRecord: LoadTestDetailChunk = {
      id: chunkId,
      runId,
      filePath: detailFile,
      startSequence: 1,
      endSequence: 1,
      recordCount: 1,
      compressedSize: compressed.length,
      createdAt: Date.now()
    };

    this.detailChunks.push(chunkRecord);

    const requestIndex = this.requestIndex.find(r => r.id === requestIndexId);
    if (requestIndex) {
      requestIndex.detailChunkId = chunkId;
    }
  }

  async endRun(runId: string) {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    const endTime = Date.now();
    const runIndex = this.runs.findIndex(r => r.id === runId);
    if (runIndex !== -1) {
      this.runs[runIndex].endTime = endTime;
      this.runs[runIndex].status = 'completed';
    }

    await this.saveData();
    return this.runs[runIndex];
  }

  async getRunStats(runId: string): Promise<LoadTestStats | null> {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    const run = this.runs.find(r => r.id === runId);
    if (!run) return null;

    const runRequests = this.requestIndex.filter(r => r.runId === runId);
    const totalRequests = runRequests.length;
    const successfulRequests = runRequests.filter(r => !r.error).length;
    const failedRequests = runRequests.filter(r => r.error).length;

    const latencies = runRequests.map(r => r.latency);
    const avgResponseTime = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const minResponseTime = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxResponseTime = latencies.length > 0 ? Math.max(...latencies) : 0;

    const duration = run.endTime ? run.endTime - run.startTime : Date.now() - run.startTime;

    return {
      runId,
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: duration > 0 ? (totalRequests / duration) * 1000 : 0,
      startTime: run.startTime,
      endTime: run.endTime || Date.now(),
      duration
    };
  }

  async getTimeSeriesData(runId: string, startTime?: number, endTime?: number): Promise<LoadTestTimeSeriesPoint[]> {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    let runRequests = this.requestIndex.filter(r => r.runId === runId);

    if (startTime) {
      runRequests = runRequests.filter(r => r.timestamp >= startTime);
    }
    if (endTime) {
      runRequests = runRequests.filter(r => r.timestamp <= endTime);
    }

    const buckets: { [key: number]: { requests: number; errors: number; totalLatency: number } } = {};

    runRequests.forEach(req => {
      const bucket = Math.floor(req.timestamp / 60000) * 60000;
      if (!buckets[bucket]) {
        buckets[bucket] = { requests: 0, errors: 0, totalLatency: 0 };
      }
      buckets[bucket].requests++;
      if (req.error) buckets[bucket].errors++;
      buckets[bucket].totalLatency += req.latency;
    });

    return Object.entries(buckets).map(([timestamp, data]) => ({
      timestamp: parseInt(timestamp),
      requests: data.requests,
      errors: data.errors,
      avgResponseTime: data.requests > 0 ? data.totalLatency / data.requests : 0,
      p50ResponseTime: 0,
      p75ResponseTime: 0,
      p90ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  async getTimeSeriesDataByRequest(runId: string, startTime?: number, endTime?: number): Promise<LoadTestTimeSeriesByRequestPoint[]> {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    let runRequests = this.requestIndex.filter(r => r.runId === runId);

    if (startTime) {
      runRequests = runRequests.filter(r => r.timestamp >= startTime);
    }
    if (endTime) {
      runRequests = runRequests.filter(r => r.timestamp <= endTime);
    }

    const buckets: { [key: string]: { [key: number]: { requests: number; errors: number; totalLatency: number } } } = {};

    runRequests.forEach(req => {
      const requestName = req.requestName;
      const bucket = Math.floor(req.timestamp / 60000) * 60000;

      if (!buckets[requestName]) {
        buckets[requestName] = {};
      }
      if (!buckets[requestName][bucket]) {
        buckets[requestName][bucket] = { requests: 0, errors: 0, totalLatency: 0 };
      }
      buckets[requestName][bucket].requests++;
      if (req.error) buckets[requestName][bucket].errors++;
      buckets[requestName][bucket].totalLatency += req.latency;
    });

    const result: LoadTestTimeSeriesByRequestPoint[] = [];

    for (const [requestName, requestBuckets] of Object.entries(buckets)) {
      for (const [timestamp, data] of Object.entries(requestBuckets)) {
        result.push({
          requestName,
          timestamp: parseInt(timestamp),
          requests: data.requests,
          errors: data.errors,
          avgResponseTime: data.requests > 0 ? data.totalLatency / data.requests : 0,
          p50ResponseTime: 0,
          p75ResponseTime: 0,
          p90ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0
        });
      }
    }

    return result.sort((a, b) => {
      if (a.requestName !== b.requestName) {
        return a.requestName.localeCompare(b.requestName);
      }
      return a.timestamp - b.timestamp;
    });
  }

  async exportRunData(runId: string, format = 'json') {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    const run = this.runs.find(r => r.id === runId);
    if (!run) return null;

    const stats = await this.getRunStats(runId);
    const timeSeries = await this.getTimeSeriesData(runId);

    const exportData = {
      run,
      stats,
      timeSeries,
      exportedAt: Date.now()
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      let csv = 'timestamp,requests,errors,avgResponseTime\n';
      csv += timeSeries.map((point: any) =>
        `${point.timestamp},${point.requests},${point.errors},${point.avgResponseTime}`
      ).join('\n');
      return csv;
    }
  }

  async getCompletedRuns() {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    return this.runs
      .filter(r => r.status === 'completed')
      .sort((a, b) => b.startTime - a.startTime);
  }

  async deleteRun(runId: string) {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    this.runs = this.runs.filter(r => r.id !== runId);
    this.runMetrics = this.runMetrics.filter(m => m.runId !== runId);
    this.requestIndex = this.requestIndex.filter(r => r.runId !== runId);
    this.detailChunks = this.detailChunks.filter(c => c.runId !== runId);

    const runDir = path.join(this.dataDir, runId);
    if (fs.existsSync(runDir)) {
      fs.rmSync(runDir, { recursive: true, force: true });
    }

    await this.saveData();
  }

  private getNextSequenceNumber(runId: string): number {
    const runRequests = this.requestIndex.filter(r => r.runId === runId);
    const maxSeq = runRequests.length > 0 ? Math.max(...runRequests.map(r => r.sequenceNumber)) : 0;
    return maxSeq + 1;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

export const loadTestingService = new LoadTestingService();