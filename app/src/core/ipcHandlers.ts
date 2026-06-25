import { ipcMain, dialog } from 'electron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'node:path';
import type { RunnerEngine } from './runnerEngine';
import { loadTestingService } from './loadTestingService';
import { sendRequest } from './requestExecutor';
import { sanitizeFilename } from './httpExecutor';
import type { LoadTestRun } from '../types';

const oauthStates = new Map<string, { codeVerifier: string; timestamp: number }>();

export function setupHttpHandlers() {
  ipcMain.handle('make-request', async (_event, options) => {
    const { makeHttpRequest } = await import('./httpClient');
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
}

export function setupDialogHandlers() {
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

      const collectionMeta = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        workspaceLocation: collection.workspaceLocation,
        preRequestScript: collection.preRequestScript,
        postRequestScript: collection.postRequestScript,
        testScript: collection.testScript,
        auth: collection.auth,
        variables: collection.variables
      };

      const metaPath = path.join(collectionDir, 'collection.json');
      await fs.promises.writeFile(metaPath, JSON.stringify(collectionMeta, null, 2), 'utf-8');

      const saveItems = async (items, currentPath) => {
        for (const item of items) {
          if (item.method) {
            const requestPath = path.join(currentPath, `${sanitizeFilename(item.name)}.json`);
            await fs.promises.writeFile(requestPath, JSON.stringify(item, null, 2), 'utf-8');
          } else {
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

      const filesDir = path.join(workspacePath, 'files');
      if (fs.existsSync(filesDir)) {
        // Load files referenced in the collection
      }

      console.log('[EXECUTION_ENGINE] loadCollectionFromFiles completed');
      return collection;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] loadCollectionFromFiles error:', error.message);
      return null;
    }
  });
}

export function setupLoadTestHandlers() {
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

  ipcMain.handle('get-load-test-time-series-data-by-status', async (_event, runId, startTime, endTime) => {
    try {
      const data = await loadTestingService.getTimeSeriesDataByStatus(runId, startTime, endTime);
      return data;
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] getLoadTestTimeSeriesDataByStatus error:', error.message);
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
}

export function setupSecretsHandlers() {
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
}

export function setupFilePickerHandlers() {
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
}

export function setupOAuthHandlers() {
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
}

export function setupExternalHandlers() {
  ipcMain.handle('open-external-url', async (_event, url: string) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
  });
}

export function setupFeedbackHandlers() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patE1GcBJhqUz3Rnm.f8cc6c625a1a18afab605613ce49c3d22a0acb0427d8e038139408b2774c39a4';
  
  ipcMain.handle('submit-feedback', async (_event, feedback: { feedback: string; type: string; email: string }) => {
    if (!AIRTABLE_API_KEY) {
      throw new Error('Airtable API key not configured');
    }
    
    try {
      const response = await fetch('https://api.airtable.com/v0/app3t7ozk8mGsgmrv/Feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          typecast: true,
          records: [{
            fields: {
              Feedback: feedback.feedback,
              Type: feedback.type,
              Status: 'Pending review',
              Email: feedback.email
            }
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.status}`);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('[EXECUTION_ENGINE] submitFeedback error:', error.message);
      throw error;
    }
  });
}

let runnerEngine: RunnerEngine | null = null;

export async function getRunnerEngine(): Promise<RunnerEngine> {
  if (!runnerEngine) {
    const { RunnerEngine } = await import('./runnerEngine');
    runnerEngine = new RunnerEngine({ threadCount: 4 });
  }
  return runnerEngine;
}

export function setupLoadTestExecutionHandlers() {
  ipcMain.handle('stop-load-test', async () => {
    console.log('[EXECUTION_ENGINE] stopLoadTest called');
    if (runnerEngine) {
      runnerEngine.stop();
    }
  });

  ipcMain.handle('run-load-test', async (_event, params: {
    config: any;
    collections: any[];
    environments: any[];
    secrets: any[];
    isSecretsUnlocked: boolean;
    activeEnvironmentId?: string | null;
    runId?: string;
    runRepeated?: boolean;
  }) => {
    console.log('[EXECUTION_ENGINE] runLoadTest called');
    const { config, collections, environments, secrets, isSecretsUnlocked, activeEnvironmentId, runId: existingRunId } = params;

    let runId = existingRunId;
    let newRun: LoadTestRun | null = null;
    let runStartTime = 0;
    const runDurationMs = config.runRepeated && config.duration && config.duration > 0 
      ? config.duration * 1000 
      : 0;

    if (!runId) {
      newRun = await loadTestingService.startRun({
        name: config.name,
        collectionId: config.collectionId,
        collectionName: config.collectionName || '',
        selectedRequests: config.selectedRequests || [],
        runMode: 'parallel',
        delay: 0,
        runRepeated: config.runRepeated || false,
        iterations: 1
      });
      runId = newRun.id;
      runStartTime = newRun.startTime;
    } else {
      // Get the existing run's start time for duration check
      const existingRun = await loadTestingService.getRunStats(runId);
      if (existingRun) {
        runStartTime = existingRun.startTime;
      }
    }

    console.log('[EXECUTION_ENGINE] runLoadTest started with runId:', runId);

    const engine = await getRunnerEngine();
    const rpsConfigs = config.requestConfigs || {};
    const results: any[] = [];

    await engine.executeLoadTest(
      config,
      collections,
      environments,
      secrets,
      isSecretsUnlocked,
      rpsConfigs,
      async (result) => {
        results.push(result);

        // Check if duration has elapsed before recording or sending stats
        if (runDurationMs > 0 && (Date.now() - runStartTime) >= runDurationMs) {
          return;
        }

        await loadTestingService.recordRequest(runId, {
          requestId: result.requestId || 'unknown',
          requestName: result.requestName,
          method: result.method,
          url: result.url || '',
          status: result.status,
          latency: result.time,
          responseSize: 0,
          timestamp: Date.now(),
          shouldCaptureFullDetail: result.status >= 500,
        });

        const stats = await loadTestingService.getRunStats(runId);
        if (stats && !_event.sender.isDestroyed()) {
          stats.lastLatency = result.time;
          stats.lastStatus = result.status;
          stats.lastRequestName = result.requestName;
          _event.sender.send('load-test-stats-update', { runId, stats });
        }
      },
      activeEnvironmentId
    );

    console.log('[EXECUTION_ENGINE] runLoadTest completed');

    if (newRun) {
      await loadTestingService.endRun(runId);
    }

    return { run: newRun, results };
  });
}

export function initializeExecutionEngine() {
  console.log('[EXECUTION_ENGINE] Initializing core execution engine...');
  
  setupHttpHandlers();
  setupDialogHandlers();
  setupLoadTestHandlers();
  setupSecretsHandlers();
  setupFilePickerHandlers();
  setupOAuthHandlers();
  setupExternalHandlers();
  setupLoadTestExecutionHandlers();
  setupFeedbackHandlers();
  
  console.log('[EXECUTION_ENGINE] All handlers registered');
}