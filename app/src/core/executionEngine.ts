import { ipcMain, dialog } from 'electron';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'node:os';
import * as zlib from 'zlib';

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
}

async function makeHttpRequest(options: { method: string; url: string; headers: Record<string, string>; body?: string; rps?: number; requestId?: string }): Promise<{ status: number; statusText: string; headers: Record<string, string | string[]>; data: string; time: number; error?: string }> {
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

    const requestOptions: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
    };

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