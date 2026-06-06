import { ipcMain, dialog } from 'electron';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'node:os';
import * as zlib from 'zlib';
import type { SendRequestContext, LoadTestRun } from '../types';
import type { RunnerEngine } from './runnerEngine';

// Load Testing Service - Simple JSON file-based storage
class LoadTestingService {
  private dataDir: string = '';
  private runs: any[] = [];
  private runMetrics: any[] = [];
  private requestIndex: any[] = [];
  private detailChunks: any[] = [];
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

      // Load existing data
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
      // Initialize empty arrays if loading fails
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



  async startRun(runConfig: any) {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    const run = {
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

    // Update run counters
    const runIndex = this.runs.findIndex(r => r.id === runId);
    if (runIndex !== -1) {
      if (isError) {
        this.runs[runIndex].failedRequests++;
      } else {
        this.runs[runIndex].completedRequests++;
      }
      this.runs[runIndex].totalRequests++;
    }

    // Add to request index
    const requestRecord = {
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

    // Handle full request/response details
    if (requestData.shouldCaptureFullDetail && requestData.requestDetail) {
      await this.storeRequestDetail(requestIndexId, runId, requestData.requestDetail);
    }

    // Save data periodically (every 100 requests)
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
    const chunkRecord = {
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

    // Update request index with chunk reference
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

  async getRunStats(runId: string) {
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
      p50ResponseTime: 0, // Would need to calculate percentiles
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: duration > 0 ? (totalRequests / duration) * 1000 : 0,
      startTime: run.startTime,
      endTime: run.endTime || Date.now(),
      duration
    };
  }

  async getTimeSeriesData(runId: string, startTime?: number, endTime?: number) {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    // Simple implementation - group by minute buckets
    let runRequests = this.requestIndex.filter(r => r.runId === runId);

    if (startTime) {
      runRequests = runRequests.filter(r => r.timestamp >= startTime);
    }
    if (endTime) {
      runRequests = runRequests.filter(r => r.timestamp <= endTime);
    }

    const buckets: { [key: number]: { requests: number; errors: number; totalLatency: number } } = {};

    runRequests.forEach(req => {
      const bucket = Math.floor(req.timestamp / 60000) * 60000; // 1-minute buckets
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
      avgResponseTime: data.requests > 0 ? data.totalLatency / data.requests : 0
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  async getTimeSeriesDataByRequest(runId: string, startTime?: number, endTime?: number): Promise<LoadTestTimeSeriesByRequestPoint[]> {
    if (!this.isInitialized) throw new Error('Load testing service not initialized');

    // Group by request name and minute buckets
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
      const bucket = Math.floor(req.timestamp / 60000) * 60000; // 1-minute buckets

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
          avgResponseTime: data.requests > 0 ? data.totalLatency / data.requests : 0
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

    // Remove from arrays
    this.runs = this.runs.filter(r => r.id !== runId);
    this.runMetrics = this.runMetrics.filter(m => m.runId !== runId);
    this.requestIndex = this.requestIndex.filter(r => r.runId !== runId);
    this.detailChunks = this.detailChunks.filter(c => c.runId !== runId);

    // Delete data directory
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

// Token Bucket implementation for rate limiting
class TokenBucket {
  capacity: number;
  tokens: number;
  rps: number;
  lastRefill: number;

  constructor(rps: number) {
    this.capacity = rps; // Maximum tokens (burst capacity)
    this.tokens = rps; // Current tokens
    this.rps = rps; // Refill rate per second
    this.lastRefill = Date.now(); // Last refill timestamp
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.rps;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  // Wait for a token to be available
  async consumeWait(): Promise<void> {
    return new Promise((resolve) => {
      const tryConsume = () => {
        this.refill();
        if (this.tokens >= 1) {
          this.tokens -= 1;
          resolve();
        } else {
          // Wait a bit and try again
          setTimeout(tryConsume, 10); // Check every 10ms
        }
      };
      tryConsume();
    });
  }

  // Update RPS rate
  setRps(newRps: number) {
    this.rps = newRps;
    this.capacity = newRps;
    // Don't change current tokens, but cap at new capacity
    this.tokens = Math.min(this.tokens, this.capacity);
  }
}

// Global token bucket store for rate limiting per request
const tokenBuckets = new Map<string, TokenBucket>();

// Global instance
const loadTestingService = new LoadTestingService();

export function initializeExecutionEngine() {
  console.log('[EXECUTION_ENGINE] Initializing core execution engine...');

  ipcMain.handle('make-request', async (_event, options) => {
    return makeHttpRequest(options);
  });

  ipcMain.handle('send-request', async (_event, context) => {
    return sendRequest(context);
  });

  ipcMain.handle('run-shell', async (_event, command) => {
    console.log('[EXECUTION_ENGINE] runShell received', { command });
    return new Promise((resolve) => {
      exec(command, { timeout: 30000 }, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.log('[EXECUTION_ENGINE] runShell error', error.message);
          resolve({ output: '', error: error.message });
        } else {
          console.log('[EXECUTION_ENGINE] runShell completed', { stdout: stdout.substring(0, 100) });
          resolve({ output: stdout, error: stderr });
        }
      });
    });
  });

  ipcMain.handle('import-collection', async () => {
    console.log('[EXECUTION_ENGINE] importCollection dialog requested');
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (result.canceled || result.filePaths.length === 0) {
        console.log('[EXECUTION_ENGINE] importCollection canceled');
        return null;
      }

      const filePath = result.filePaths[0];
      console.log('[EXECUTION_ENGINE] importCollection file selected:', filePath);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log('[EXECUTION_ENGINE] importCollection read success, length:', content.length);
        return content;
      } catch (err) {
        console.error('[EXECUTION_ENGINE] importCollection read error:', err);
        return null;
      }
    } catch (err) {
      console.error('[EXECUTION_ENGINE] importCollection dialog error:', err);
      return null;
    }
  });

  ipcMain.handle('import-environment', async () => {
    console.log('[EXECUTION_ENGINE] importEnvironment dialog requested');
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (result.canceled || result.filePaths.length === 0) {
        console.log('[EXECUTION_ENGINE] importEnvironment canceled');
        return null;
      }

      const filePath = result.filePaths[0];
      console.log('[EXECUTION_ENGINE] importEnvironment file selected:', filePath);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log('[EXECUTION_ENGINE] importEnvironment read success, length:', content.length);
        return content;
      } catch (err) {
        console.error('[EXECUTION_ENGINE] importEnvironment read error:', err);
        return null;
      }
    } catch (err) {
      console.error('[EXECUTION_ENGINE] importEnvironment dialog error:', err);
      return null;
    }
  });

  ipcMain.handle('select-workspace', async () => {
    console.log('[EXECUTION_ENGINE] selectWorkspace called');
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Workspace Directory'
      });

      if (result.canceled || result.filePaths.length === 0) {
        console.log('[EXECUTION_ENGINE] selectWorkspace canceled');
        return null;
      }

      const workspacePath = result.filePaths[0];
      console.log('[EXECUTION_ENGINE] selectWorkspace selected:', workspacePath);
      return workspacePath;
    } catch (err) {
      console.error('[EXECUTION_ENGINE] selectWorkspace error:', err);
      return null;
    }
  });

  ipcMain.handle('save-collection-to-files', async (_event, collection, workspacePath) => {
    console.log('[EXECUTION_ENGINE] saveCollectionToFiles called for collection:', collection.name, 'workspace:', workspacePath);
    try {
      const collectionDir = path.join(workspacePath, sanitizeFilename(collection.name));
      await fs.promises.mkdir(collectionDir, { recursive: true });

      // Save collection metadata
      const collectionMeta = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        workspaceLocation: collection.workspaceLocation,
        preRequestScript: collection.preRequestScript,
        testScript: collection.testScript,
        auth: collection.auth,
        variables: collection.variables
      };

      const metaPath = path.join(collectionDir, 'collection.json');
      await fs.promises.writeFile(metaPath, JSON.stringify(collectionMeta, null, 2), 'utf-8');

      // Save requests recursively
      const saveItems = async (items, currentPath) => {
        for (const item of items) {
          if (item.method) {
            // It's a request
            const requestPath = path.join(currentPath, `${sanitizeFilename(item.name)}.json`);
            await fs.promises.writeFile(requestPath, JSON.stringify(item, null, 2), 'utf-8');
          } else {
            // It's a folder
            const folderPath = path.join(currentPath, sanitizeFilename(item.name));
            await fs.promises.mkdir(folderPath, { recursive: true });
            if (item.items) {
              await saveItems(item.items, folderPath);
            }
          }
        }
      };

      if (collection.items) {
        await saveItems(collection.items, collectionDir);
      }

      console.log('[EXECUTION_ENGINE] saveCollectionToFiles completed');
      return true;
    } catch (err) {
      console.error('[EXECUTION_ENGINE] saveCollectionToFiles error:', err);
      return false;
    }
  });

  ipcMain.handle('load-collection-from-files', async (_event, collectionName, workspacePath) => {
    console.log('[EXECUTION_ENGINE] loadCollectionFromFiles received', { collectionName, workspacePath });

    try {
      const collectionPath = path.join(workspacePath, 'collections', `${collectionName}.json`);
      if (!fs.existsSync(collectionPath)) {
        console.log('[EXECUTION_ENGINE] Collection file not found, returning null:', collectionPath);
        return null;
      }

      const collectionData = fs.readFileSync(collectionPath, 'utf-8');
      const collection = JSON.parse(collectionData);

      // Load associated files if they exist
      const filesDir = path.join(workspacePath, 'files');
      if (fs.existsSync(filesDir)) {
        // Load files referenced in the collection
        // This would need more implementation for full file loading
      }

      console.log('[EXECUTION_ENGINE] loadCollectionFromFiles completed');
      return collection;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] loadCollectionFromFiles error:', error.message);
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  });

  // Load Testing IPC Handlers
  ipcMain.handle('initialize-load-testing', async () => {
    console.log('[EXECUTION_ENGINE] initializeLoadTesting called');
    try {
      await loadTestingService.initialize();
      console.log('[EXECUTION_ENGINE] initializeLoadTesting completed');
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] initializeLoadTesting error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('start-load-test-run', async (_event, runConfig) => {
    console.log('[EXECUTION_ENGINE] startLoadTestRun called', runConfig);
    try {
      const run = await loadTestingService.startRun(runConfig);
      console.log('[EXECUTION_ENGINE] startLoadTestRun completed', run.id);
      return run;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] startLoadTestRun error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('record-load-test-request', async (_event, runId, requestData) => {
    try {
      await loadTestingService.recordRequest(runId, requestData);
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] recordLoadTestRequest error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('end-load-test-run', async (_event, runId) => {
    console.log('[EXECUTION_ENGINE] endLoadTestRun called', runId);
    try {
      const run = await loadTestingService.endRun(runId);
      console.log('[EXECUTION_ENGINE] endLoadTestRun completed', runId);
      return run;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] endLoadTestRun error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('get-load-test-run-stats', async (_event, runId) => {
    try {
      const stats = await loadTestingService.getRunStats(runId);
      return stats;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] getLoadTestRunStats error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('get-load-test-time-series-data', async (_event, runId, startTime, endTime) => {
    try {
      const data = await loadTestingService.getTimeSeriesData(runId, startTime, endTime);
      return data;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] getLoadTestTimeSeriesData error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('get-load-test-time-series-data-by-request', async (_event, runId, startTime, endTime) => {
    try {
      const data = await loadTestingService.getTimeSeriesDataByRequest(runId, startTime, endTime);
      return data;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] getLoadTestTimeSeriesDataByRequest error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('export-load-test-run-data', async (_event, runId, format) => {
    console.log('[EXECUTION_ENGINE] exportLoadTestRunData called', runId, format);
    try {
      const data = await loadTestingService.exportRunData(runId, format);
      console.log('[EXECUTION_ENGINE] exportLoadTestRunData completed');
      return data;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] exportLoadTestRunData error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('get-completed-load-test-runs', async () => {
    try {
      const runs = await loadTestingService.getCompletedRuns();
      return runs;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] getCompletedLoadTestRuns error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('delete-load-test-run', async (_event, runId) => {
    console.log('[EXECUTION_ENGINE] deleteLoadTestRun called', runId);
    try {
      await loadTestingService.deleteRun(runId);
      console.log('[EXECUTION_ENGINE] deleteLoadTestRun completed');
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] deleteLoadTestRun error:', error.message);
      throw error;
    }
  });

  // Secrets Import/Export with file path selection
  ipcMain.handle('export-secrets-dialog', async (_event, secretsData) => {
    console.log('[EXECUTION_ENGINE] exportSecretsDialog requested');

    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Secrets',
        defaultPath: `secrets_${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      // Write the secrets data to the selected file
      const fs = require('fs');
      fs.writeFileSync(result.filePath, secretsData, 'utf-8');

      console.log('[EXECUTION_ENGINE] exportSecretsDialog completed, saved to:', result.filePath);
      return result.filePath;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] exportSecretsDialog error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('import-secrets-dialog', async () => {
    console.log('[EXECUTION_ENGINE] importSecretsDialog requested');

    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Secrets',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      const fs = require('fs');

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      console.log('[EXECUTION_ENGINE] importSecretsDialog completed, loaded from:', filePath);
      return {
        filePath,
        content: fileContent
      };
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] importSecretsDialog error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('select-datafile-dialog', async (_event, filters) => {
    console.log('[EXECUTION_ENGINE] selectDatafileDialog requested');

    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Data File',
        filters: filters || [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, filePaths: [] };
      }

      console.log('[EXECUTION_ENGINE] selectDatafileDialog completed, selected:', result.filePaths[0]);
      return { canceled: false, filePaths: result.filePaths };
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] selectDatafileDialog error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('show-open-dialog', async (_event, filters) => {
    console.log('[EXECUTION_ENGINE] showOpenDialog requested');

    try {
      const result = await dialog.showOpenDialog({
        title: 'Select File',
        filters: filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, filePaths: [] };
      }

      console.log('[EXECUTION_ENGINE] showOpenDialog completed, selected:', result.filePaths[0]);
      return { canceled: false, filePaths: result.filePaths };
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] showOpenDialog error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('select-certificate-file-dialog', async (_event, filters) => {
    console.log('[EXECUTION_ENGINE] selectCertificateFileDialog requested');

    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Certificate File',
        filters: filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, filePaths: [] };
      }

      console.log('[EXECUTION_ENGINE] selectCertificateFileDialog completed, selected:', result.filePaths[0]);
      return { canceled: false, filePaths: result.filePaths };
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] selectCertificateFileDialog error:', error.message);
      throw error;
    }
  });

  // ─── OAuth 2.0 PKCE State Management ───────────────────────────────────────────
  const oauthStates = new Map<string, { codeVerifier: string; timestamp: number }>();

  ipcMain.handle('store-oauth-state', async (_event, oauthState: { state: string; codeVerifier: string }) => {
    console.log('[EXECUTION_ENGINE] Storing OAuth state', oauthState.state.substring(0, 8) + '...');
    oauthStates.set(oauthState.state, {
      codeVerifier: oauthState.codeVerifier,
      timestamp: Date.now()
    });
    setTimeout(() => oauthStates.delete(oauthState.state), 10 * 60 * 1000);
  });

  ipcMain.handle('get-oauth-state', async (_event, state: string) => {
    const oauthState = oauthStates.get(state);
    return oauthState?.codeVerifier || null;
  });

  ipcMain.handle('exchange-oauth-code', async (_event, params: {
    code: string;
    tokenUrl: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    codeVerifier?: string;
  }) => {
    console.log('[EXECUTION_ENGINE] Exchanging OAuth code for token');

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
    });

    if (params.clientSecret) {
      tokenParams.set('client_secret', params.clientSecret);
    }
    if (params.codeVerifier) {
      tokenParams.set('code_verifier', params.codeVerifier);
    }

    try {
      const response = await fetch(params.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams.toString()
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('[EXECUTION_ENGINE] OAuth token received');

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] OAuth token exchange error:', error.message);
      throw error;
    }
  });

  ipcMain.handle('open-external-url', async (_event, url: string) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
  });
}

// ─── Types for store data received via IPC ───────────────────────────────────

interface RequestHeaderData {
  key: string;
  value: string;
  enabled: boolean;
}

interface AuthData {
  type: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  domain?: string;
  workstation?: string;
  ntlm?: {
    username?: string;
    password?: string;
    domain?: string;
    workstation?: string;
  };
  apikey?: { key: string; value: string; in: string };
  clientCertificate?: {
    type: 'pkcs12' | 'pem';
    filePath?: string;
    passphrase?: string;
    certPath?: string;
    keyPath?: string;
  };
  oauth2?: {
    grantType: 'authorization_code' | 'client_credentials' | 'resource_owner_password' | 'refresh_token';
    authorizationUrl?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    username?: string;
    password?: string;
    refreshToken?: string;
    accessToken?: string;
  };
}

interface RequestBodyData {
  type: string;
  content: string;
}

interface RequestVariableData {
  key: string;
  value: string;
  enabled: boolean;
  dataset?: string;
}

// Snapshot of the current request as plain data (no reactive Pinia store)
interface RequestSnapshot {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: RequestHeaderData[];
  body: RequestBodyData;
  auth?: AuthData;
  preRequestScript?: string;
  testScript?: string;
  variables?: RequestVariableData[];
  dependsOn?: string; // dependency request id
}

// Snapshot of the requests-store data segment
interface RequestsStoreData {
  currentRequest: RequestSnapshot;
  requestHeaders: RequestHeaderData[];
}

// Snapshots of single-value stores used for variable resolution
interface ResponseStoreData {
  response: unknown;
  testResults: string;
  activeResponseTab: string;
  isLoading: boolean;
}

interface EnvironmentsStoreData {
  environments: { id: string; name: string; variables: VariableData[]; active: boolean }[];
  activeEnvironmentId: string | null;
}

interface CollectionsStoreData {
  collections: { id: string; name: string; items: any[]; variables: VariableData[] }[];
  selectedCollectionId: string | null;
}

interface AppStoreData {
  secrets: { id: string; name: string; env: string; value: string }[];
  selectedSecretId: string | null;
}

interface SecretsStoreData {
  // No runtime secrets data needed; unlocked state only
  isUnlocked: boolean;
}

interface VariableData {
  key: string;
  value: string;
  enabled: boolean;
}

// ─── sendRequest: core execution logic ───────────────────────────────────────

function substituteVariable(
  match: string,
  varName: string,
  envVars: VariableData[],
  reqVars: RequestVariableData[],
  secrets: { name: string; value: string }[] | undefined,
): string {
  // 1) Environment variables
  const envVar = envVars.find((v) => v.key === varName);
  if (envVar) return envVar.value;

  // 2) Request variables
  const reqVar = reqVars.find((v) => v.key === varName);
  if (reqVar) return reqVar.value;

  // 3) Secrets
  if (secrets) {
    const secret = secrets.find((s) => s.name === varName);
    if (secret && secret.value) return secret.value;
  }

  return match;
}

function substituteAll(
  text: string,
  envVars: VariableData[],
  reqVars: RequestVariableData[],
  secrets: { name: string; value: string }[] | undefined,
): string {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) =>
    substituteVariable(_match, varName, envVars, reqVars, secrets),
  );
}

function resolveEnvVars(envStore: EnvironmentsStoreData): VariableData[] {
  const active = envStore.environments.find((e) => e.id === envStore.activeEnvironmentId);
  return active ? active.variables : [];
}

function applyAuthAndHeaders(
  opts: { headers: Record<string, string> },
  auth: AuthData | undefined,
  seVars: VariableData[],
  reqVars: RequestVariableData[],
  secrets: { name: string; value: string }[] | undefined,
): void {
  if (!auth) return;

  if (auth.type === 'bearer' && auth.bearerToken) {
    opts.headers['Authorization'] = `Bearer ${substituteAll(auth.bearerToken, seVars, reqVars, secrets)}`;
  } else if (auth.type === 'basic' && auth.username && auth.password) {
    const u = substituteAll(auth.username, seVars, reqVars, secrets);
    const p = substituteAll(auth.password, seVars, reqVars, secrets);
    opts.headers['Authorization'] = `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
  } else if (auth.type === 'ntlm' && auth.ntlm) {
    const domain = substituteAll(auth.ntlm.domain || '', seVars, reqVars, secrets);
    const username = substituteAll(auth.ntlm.username || '', seVars, reqVars, secrets);
    const password = substituteAll(auth.ntlm.password || '', seVars, reqVars, secrets);
    const credentials = domain ? `${domain}\\${username}` : username;
    opts.headers['Authorization'] = `NTLM ${credentials}:${password}`;
  } else if (auth.type === 'oauth2' && auth.oauth2) {
    if (auth.oauth2.accessToken) {
      opts.headers['Authorization'] = `Bearer ${auth.oauth2.accessToken}`;
    }
  } else if (auth.type === 'apikey' && auth.apikey) {
    const k = substituteAll(auth.apikey.key, seVars, reqVars, secrets);
    const v = substituteAll(auth.apikey.value, seVars, reqVars, secrets);
    if (auth.apikey.in === 'header') {
      opts.headers[k] = v;
    } else {
      const urlObj = new URL(opts.url);
      urlObj.searchParams.set(k, v);
      opts.url = urlObj.toString();
    }
  }
}

function setContentType(
  headers: Record<string, string>,
  bodyType: string,
  hasBody: boolean,
): void {
  if (!hasBody) return;
  if (bodyType === 'json') headers['Content-Type'] = 'application/json';
  else if (bodyType === 'x-www-form-urlencoded') headers['Content-Type'] = 'application/x-www-form-urlencoded';
  else if (bodyType === 'form-data') headers['Content-Type'] = 'multipart/form-data';
  else if (bodyType === 'graphql') headers['Content-Type'] = 'application/json';
}

// Build a flat, indexable collection of (id → request) for dependency resolution
function flatRequests(items: any[]): Map<string, any> {
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
}

interface ExecutedRequest {
  id: string;
  name: string;
  status: number;
  statusText: string;
  time: number;
  error?: string;
}

interface SendRequestResult {
  response: {
    status: number;
    statusText: string;
    data: string;
    time: number;
    headers: Record<string, string | string[]>;
    error?: string;
  };
  substitutedRequest: RequestSnapshot;
  executedDependencies: ExecutedRequest[];
  historyEntries: unknown[];
  testResults: string;
}

async function executeDepRequest(
  request: any,
  seVars: VariableData[],
  reqVars: RequestVariableData[],
  secrets: { name: string; value: string }[] | undefined,
  parentAuth?: AuthData | undefined,
): Promise<ExecutedRequest> {
  let url = substituteAll(request.url, seVars, reqVars, secrets);
  let body = request.body && request.body.type !== 'none' && request.body.content
    ? substituteAll(request.body.content, seVars, reqVars, secrets)
    : undefined;

  const headers: Record<string, string> = {};

  // Auth - handle 'inherit' type
  const effectiveAuth = request.auth?.type === 'inherit' ? parentAuth : request.auth;
  if (effectiveAuth) {
    applyAuthAndHeaders({ headers, url }, effectiveAuth, seVars, reqVars, secrets);
  }

  // Per-request headers
  if (request.headers && Array.isArray(request.headers)) {
    for (const h of request.headers) {
      if (h.key && h.enabled) headers[h.key] = substituteAll(h.value, seVars, reqVars, secrets);
    }
  }

  setContentType(headers, request.body?.type || 'none', !!body);

  const result = await makeHttpRequest({
    method: request.method,
    url,
    headers,
    body,
  });

  return {
    id: request.id,
    name: request.name,
    status: result.status,
    statusText: result.statusText,
    time: result.time,
    error: result.error,
  };
}

/**
 * sendRequest
 *
 * Core request-execution logic extracted from the renderer panel.  All requests,
 * variable substitution, auth handling, dependency resolution and test-script
 * evaluation happen here so that the renderer is merely a thin orchestration
 * layer.
 *
 * @param context Store data received from the renderer via IPC.  Because the
 *                execution engine runs in the main process it cannot hold
 *                references to live reactive Pinia stores; instead the
 *                renderer passes plain serialisable snapshots.
 */
async function sendRequest(context: SendRequestContext, rps: number = 0, requestId: string = ''): Promise<SendRequestResult> {
  const {
    requestsStore,
    responseStore: _responseStore,
    historyStore: _historyStore,
    environmentsStore,
    appStore,
    collectionsStore,
    secretsStore,
  } = context;

  const reqStore = requestsStore as RequestsStoreData;
  const envStore = environmentsStore as EnvironmentsStoreData;
  const appData = appStore as AppStoreData;
  const secStore = secretsStore as SecretsStoreData | undefined;
  const collStore = collectionsStore as CollectionsStoreData | undefined;

  let mainRequest = reqStore.currentRequest;
  const mainId = mainRequest.id;

  // Resolve variable sources once
  const seVars = resolveEnvVars(envStore);
  const secrets = appData.secrets;
  const secUnlocked = secStore?.isUnlocked ?? false;
  const accessibleSecrets = secUnlocked ? secrets : undefined;

  // ── Dependency resolution ───────────────────────────────────────────────

  const requestMapper = collStore ? flatRequests(collStore.collections) : new Map<string, any>();
  const executedIds = new Set<string>();
  const executedDeps: ExecutedRequest[] = [];
  const historyEntries: unknown[] = [];

  async function resolveAndRunDep(depId: string, parentAuth?: AuthData): Promise<void> {
    if (executedIds.has(depId)) return;

    const depRequest = requestMapper.get(depId);
    if (!depRequest) return;

    if (depRequest.dependsOn && depRequest.dependsOn !== depId) {
      await resolveAndRunDep(depRequest.dependsOn, depRequest.auth?.type === 'inherit' ? parentAuth : depRequest.auth);
    }

    const reqVars: RequestVariableData[] = [...(depRequest.variables || [])];
    const result = await executeDepRequest(depRequest, seVars, reqVars, accessibleSecrets, 
      depRequest.auth?.type === 'inherit' ? parentAuth : depRequest.auth
    );
    executedIds.add(depId);
    executedDeps.push(result);

    // Build canned history entry for the dependency
    historyEntries.push({
      id: Date.now() + executedIds.size,
      method: depRequest.method,
      url: result.status !== 0 && result.time !== undefined ? mainRequest.url : depRequest.url,
      status: result.status,
      time: result.time,
      timestamp: Date.now(),
      request: depRequest,
      response: {
        status: result.status,
        statusText: result.statusText,
        data: '',
        time: result.time,
        headers: {},
        error: result.error,
      },
    });
  }

  // Get parent auth from collection for inherit
  const parentAuth = mainRequest.auth?.type === 'inherit' 
    ? (collStore ? collStore.collections.find((c: any) => c.id === collStore.selectedCollectionId)?.auth as AuthData : undefined)
    : undefined;

  if (mainRequest.dependsOn) {
    await resolveAndRunDep(mainRequest.dependsOn, parentAuth);
  }

  // ── Execute main request ────────────────────────────────────────────────

  let url = substituteAll(mainRequest.url, seVars, [...(mainRequest.variables || [])], accessibleSecrets);
  let body = mainRequest.body && mainRequest.body.type !== 'none' && mainRequest.body.content
    ? substituteAll(mainRequest.body.content, seVars, [...(mainRequest.variables || [])], accessibleSecrets)
    : undefined;

  const headers: Record<string, string> = {};

  const substRequest = JSON.parse(JSON.stringify(mainRequest));
  substRequest.url = url;
  if (body !== undefined) substRequest.body.content = body;

  // Auth on substituted request snapshot
  if (substRequest.auth) {
    const a = substRequest.auth;
    if (a.type === 'bearer' && a.bearerToken) a.bearerToken = substituteAll(a.bearerToken, seVars, [...(substRequest.variables || [])], accessibleSecrets);
    else if (a.type === 'basic') {
      if (a.username) a.username = substituteAll(a.username, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.password) a.password = substituteAll(a.password, seVars, [...(substRequest.variables || [])], accessibleSecrets);
    } else if (a.type === 'clientcertificate' && a.clientCertificate) {
      if (a.clientCertificate.type === 'pkcs12' && a.clientCertificate.filePath) a.clientCertificate.filePath = substituteAll(a.clientCertificate.filePath, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.clientCertificate.passphrase) a.clientCertificate.passphrase = substituteAll(a.clientCertificate.passphrase, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.clientCertificate.type === 'pem') {
        if (a.clientCertificate.certPath) a.clientCertificate.certPath = substituteAll(a.clientCertificate.certPath, seVars, [...(substRequest.variables || [])], accessibleSecrets);
        if (a.clientCertificate.keyPath) a.clientCertificate.keyPath = substituteAll(a.clientCertificate.keyPath, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      }
    } else if (a.type === 'ntlm' && a.ntlm) {
      if (a.ntlm.domain) a.ntlm.domain = substituteAll(a.ntlm.domain, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.ntlm.username) a.ntlm.username = substituteAll(a.ntlm.username, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.ntlm.password) a.ntlm.password = substituteAll(a.ntlm.password, seVars, [...(substRequest.variables || [])], accessibleSecrets);
    } else if (a.type === 'oauth2' && a.oauth2) {
      if (a.oauth2.tokenUrl) a.oauth2.tokenUrl = substituteAll(a.oauth2.tokenUrl, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.clientId) a.oauth2.clientId = substituteAll(a.oauth2.clientId, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.clientSecret) a.oauth2.clientSecret = substituteAll(a.oauth2.clientSecret, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.scope) a.oauth2.scope = substituteAll(a.oauth2.scope, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.username) a.oauth2.username = substituteAll(a.oauth2.username, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.password) a.oauth2.password = substituteAll(a.oauth2.password, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.refreshToken) a.oauth2.refreshToken = substituteAll(a.oauth2.refreshToken, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      if (a.oauth2.accessToken) a.oauth2.accessToken = substituteAll(a.oauth2.accessToken, seVars, [...(substRequest.variables || [])], accessibleSecrets);
    } else if (a.type === 'apikey' && a.apikey) {
      a.apikey.key = substituteAll(a.apikey.key, seVars, [...(substRequest.variables || [])], accessibleSecrets);
      a.apikey.value = substituteAll(a.apikey.value, seVars, [...(substRequest.variables || [])], accessibleSecrets);
    }
  }

  // Per-request header substitution
  if (substRequest.headers) {
    substRequest.headers.forEach((h: any) => { if (h.value) h.value = substituteAll(h.value, seVars, [...(substRequest.variables || [])], accessibleSecrets); });
  }

  // Resolve auth - check if inheriting from collection
  const resolveAuth = (): AuthData | undefined => {
    if (!mainRequest.auth || mainRequest.auth.type === 'inherit') {
      // Inherit auth from collection
      if (collStore) {
        const collection = collStore.collections.find((c: any) => c.id === collStore.selectedCollectionId);
        return collection?.auth as AuthData;
      }
      return undefined;
    }
    return mainRequest.auth;
  };

  // Auth headers / query params on execution options
  applyAuthAndHeaders({ headers, url }, resolveAuth(), seVars, [...(mainRequest.variables || [])], accessibleSecrets);

  // Request-panel headers (enabled only)
  for (const h of reqStore.requestHeaders) {
    if (h.key && h.enabled) headers[h.key] = substituteAll(h.value, seVars, [...(mainRequest.variables || [])], accessibleSecrets);
  }

setContentType(headers, mainRequest.body?.type || 'none', !!body);

   const mainResult = await makeHttpRequest({
     method: mainRequest.method,
     url,
     headers,
     body,
     rps,
     requestId,
   });

  const now = Date.now();

  historyEntries.push({
    id: now,
    method: mainRequest.method,
    url,
    status: mainResult.status,
    time: mainResult.time,
    timestamp: now,
    request: substRequest,
    response: {
      status: mainResult.status,
      statusText: mainResult.statusText,
      data: mainResult.data,
      time: mainResult.time,
      headers: mainResult.headers,
      error: mainResult.error,
    },
  });

  // Run test script (placeholder)
  let testResults = '';
  if (mainRequest.testScript) {
    try {
      testResults = `Test script would execute:\n${mainRequest.testScript}`;
    } catch (scriptError: any) {
      testResults = `Test script error: ${scriptError.message}`;
    }
  }

  return {
    response: {
      status: mainResult.status,
      statusText: mainResult.statusText,
      data: mainResult.data,
      time: mainResult.time,
      headers: mainResult.headers,
      error: mainResult.error,
    },
    substitutedRequest: substRequest,
    executedDependencies: executedDeps,
    historyEntries,
    testResults,
  };
}

// Export sendRequest for use by runnerEngine and other modules
export { sendRequest };
async function makeHttpRequest(options: { method: string; url: string; headers: Record<string, string>; body?: string; rps?: number; requestId?: string; auth?: AuthData }): Promise<{ status: number; statusText: string; headers: Record<string, string | string[]>; data: string; time: number; error?: string }> {
  return new Promise(async (resolve) => {
    const startTime = Date.now();

    // Apply rate limiting if RPS is specified
    if (options.rps && options.rps > 0 && options.requestId) {
      const requestId = options.requestId;

      // Get or create token bucket for this request
      if (!tokenBuckets.has(requestId)) {
        tokenBuckets.set(requestId, new TokenBucket(options.rps));
      }

      const bucket = tokenBuckets.get(requestId)!;

      // Update RPS if it changed
      if (bucket.rps !== options.rps) {
        bucket.setRps(options.rps);
      }

      // Wait for a token to be available
      await bucket.consumeWait();
      console.log(`[RATE LIMIT] ${requestId}: TOKEN CONSUMED (${bucket.tokens.toFixed(2)} tokens remaining)`);
    }

    const parsedUrl = new URL(options.url);

    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestOptions: http.RequestOptions & { pfx?: Buffer; passphrase?: string; key?: Buffer; cert?: Buffer } = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
    };

    // Handle client certificate authentication
    if (options.auth?.type === 'clientcertificate' && options.auth.clientCertificate) {
      const certConfig = options.auth.clientCertificate;
      try {
        if (certConfig.type === 'pkcs12' && certConfig.filePath) {
          requestOptions.pfx = fs.readFileSync(certConfig.filePath);
          if (certConfig.passphrase) {
            requestOptions.passphrase = certConfig.passphrase;
          }
          console.log('[EXECUTION_ENGINE] PKCS#12 client certificate configured');
        } else if (certConfig.type === 'pem' && certConfig.certPath && certConfig.keyPath) {
          requestOptions.cert = fs.readFileSync(certConfig.certPath);
          requestOptions.key = fs.readFileSync(certConfig.keyPath);
          console.log('[EXECUTION_ENGINE] PEM client certificate configured');
        }
      } catch (certError: any) {
        console.error('[EXECUTION_ENGINE] Client certificate error:', certError.message);
      }
    }

    // Handle NTLM authentication - requires separate challenge-response flow
    if (options.auth?.type === 'ntlm' && options.auth.ntlm) {
      await makeNtlmAuthenticatedRequest(requestOptions, httpModule, options, startTime, resolve);
      return;
    }

    const request = httpModule.request(requestOptions);

    let responseBody = '';
    let responseHeaders: Record<string, string | string[]> = {};
    let statusCode = 0;
    let statusMessage = '';

    request.on('response', (response) => {
      statusCode = response.statusCode || 0;
      statusMessage = response.statusMessage || '';
      
      const headers: Record<string, string | string[]> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (value !== undefined) {
          headers[key] = value;
        }
      }
      responseHeaders = headers;

      response.on('data', (chunk) => {
        responseBody += chunk.toString();
      });

      response.on('end', () => {
        const endTime = Date.now();
        console.log('[EXECUTION_ENGINE] makeRequest completed', { status: statusCode, statusText: statusMessage, time: endTime - startTime });
        resolve({
          status: statusCode,
          statusText: statusMessage,
          headers: responseHeaders,
          data: responseBody,
          time: endTime - startTime,
        });
      });
    });

    request.on('error', (error) => {
      console.error('[EXECUTION_ENGINE] makeRequest error', error.message);
      resolve({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: '',
        error: error.message,
        time: Date.now() - startTime,
      });
    });

    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      request.write(options.body);
    }

    request.end();
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// IPC handler for running load tests in the main process
let runnerEngine: RunnerEngine | null = null;

async function getRunnerEngine(): Promise<RunnerEngine> {
  if (!runnerEngine) {
    // Import dynamically - Vite bundles this module together, avoiding runtime file lookup
    const { RunnerEngine } = await import('./runnerEngine');
    runnerEngine = new RunnerEngine({ threadCount: 4 });
  }
  return runnerEngine;
}

// IPC handler to stop the running load test
ipcMain.handle('stop-load-test', async () => {
  console.log('[EXECUTION_ENGINE] stopLoadTest called');
  if (runnerEngine) {
    runnerEngine.stop();
  }
});

interface RunLoadTestParams {
  config: any;
  collections: any[];
  environments: any[];
  secrets: any[];
  isSecretsUnlocked: boolean;
  runId?: string;
  runRepeated?: boolean;
}

ipcMain.handle('run-load-test', async (_event, params: RunLoadTestParams) => {
  console.log('[EXECUTION_ENGINE] runLoadTest called');
  const { config, collections, environments, secrets, isSecretsUnlocked, runId: existingRunId } = params;
  
  // Use existing runId if provided, otherwise create a new run
  let runId = existingRunId;
  let newRun: LoadTestRun | null = null;
  
  if (!runId) {
    newRun = await loadTestingService.startRun({
      name: config.name,
      collectionId: config.collectionId,
      collectionName: config.collectionName || '',
      selectedRequests: config.selectedRequests,
      runMode: 'parallel',
      delay: 0,
      runRepeated: config.runRepeated || false,
      iterations: 1
    });
    runId = newRun.id;
  }
  
  console.log('[EXECUTION_ENGINE] runLoadTest started with runId:', runId);
  
  const engine = await getRunnerEngine();
  
  // Get RPS configs from config (passed from runner.ts)
  const rpsConfigs = config.requestConfigs || {};
  
  // Track results
  const results: any[] = [];
  
  // Execute load test with request recording callback
  await engine.executeLoadTest(
    config,
    collections,
    environments,
    secrets,
    isSecretsUnlocked,
    rpsConfigs,
    async (result) => {
      results.push(result);
      
      // Record the request in the load test service
      await loadTestingService.recordRequest(runId, {
        requestId: config.selectedRequests[0] || 'unknown',
        requestName: result.requestName,
        method: result.method,
        url: '',
        status: result.status,
        latency: result.time,
        responseSize: 0,
        timestamp: Date.now(),
        shouldCaptureFullDetail: result.status >= 500,
      });
      
      // Get updated stats and send to renderer
      const stats = await loadTestingService.getRunStats(runId);
      if (stats && _event.sender.isDestroyed() === false) {
        // Add the last request info for rolling window update
        stats.lastLatency = result.time;
        stats.lastStatus = result.status;
        stats.lastRequestName = result.requestName;
        _event.sender.send('load-test-stats-update', { runId, stats });
      }
    }
  );
  
  console.log('[EXECUTION_ENGINE] runLoadTest completed');
  
  // End the run only if we created it
  if (newRun) {
    await loadTestingService.endRun(runId);
  }
  
  // Return both run and results so renderer can set currentRun
  return { run: newRun, results };
});

async function makeNtlmAuthenticatedRequest(
  requestOptions: http.RequestOptions & { pfx?: Buffer; passphrase?: string; key?: Buffer; cert?: Buffer },
  httpModule: typeof http | typeof https,
  options: { method: string; url: string; headers: Record<string, string>; body?: string; auth?: AuthData },
  startTime: number,
  resolve: (result: { status: number; statusText: string; headers: Record<string, string | string[]>; data: string; time: number; error?: string }) => void
): Promise<void> {
  const ntlmConfig = options.auth!.ntlm!;
  const domain = ntlmConfig.domain || '';
  const username = ntlmConfig.username || '';
  const password = ntlmConfig.password || '';
  const workstation = ntlmConfig.workstation || '';

  const negotiateMsg = createNtlmNegotiateMessage(domain, username, workstation);
  (requestOptions.headers as Record<string, string>)['Authorization'] = `NTLM ${negotiateMsg}`;

  const request = httpModule.request(requestOptions, async (response) => {
    const statusCode = response.statusCode || 0;
    const statusMessage = response.statusMessage || '';

    const responseHeaders: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(response.headers)) {
      if (value !== undefined) {
        responseHeaders[key] = value;
      }
    }

    let responseBody = '';
    response.on('data', (chunk) => {
      responseBody += chunk.toString();
    });

    response.on('end', async () => {
      const wwwAuthenticate = responseHeaders['www-authenticate'];
      
      if (statusCode === 401 && wwwAuthenticate && typeof wwwAuthenticate === 'string' && wwwAuthenticate.includes('NTLM')) {
        console.log('[EXECUTION_ENGINE] NTLM challenge received - full implementation requires ntlm-client package');
        
        resolve({
          status: statusCode,
          statusText: statusMessage,
          headers: responseHeaders,
          data: responseBody,
          time: Date.now() - startTime,
          error: 'NTLM challenge-response requires ntlm-client npm package for full authentication.',
        });
      } else {
        resolve({
          status: statusCode,
          statusText: statusMessage,
          headers: responseHeaders,
          data: responseBody,
          time: Date.now() - startTime,
        });
      }
    });
  });

  request.on('error', (error) => {
    resolve({
      status: 0,
      statusText: 'Error',
      headers: {},
      data: '',
      error: error.message,
      time: Date.now() - startTime,
    });
  });

  if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    request.write(options.body);
  }
  request.end();
}

function createNtlmNegotiateMessage(domain: string, username: string, workstation: string): string {
  const body = Buffer.alloc(40);
  body.writeUInt8(1, 0);
  body.write(domain || '', 12, 'utf8');
  body.write(username || '', 20, 'utf8');
  body.write(workstation || '', 28, 'utf8');
  return body.toString('base64');
}