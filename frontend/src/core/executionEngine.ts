import { ipcMain, dialog } from 'electron';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { exec } from 'child_process';
import fs from 'fs';

export function initializeExecutionEngine() {
  console.log('[EXECUTION_ENGINE] Initializing core execution engine...');

  ipcMain.handle('make-request', async (_event, options) => {
    console.log('[EXECUTION_ENGINE] makeRequest received', { method: options.method, url: options.url, headers: options.headers });
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
}

function makeHttpRequest(options: { method: string; url: string; headers: Record<string, string>; body?: string }): Promise<{ status: number; statusText: string; headers: Record<string, string | string[]>; data: string; time: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
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