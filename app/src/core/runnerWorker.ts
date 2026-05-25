/**
 * Runner Worker - Executes HTTP requests in a worker thread
 * 
 * This file is loaded via worker_threads in the main process.
 * It provides isolated request execution without blocking the renderer.
 */
import { parentPort, workerData } from 'worker_threads';
import { URL } from 'url';
import http from 'http';
import https from 'https';

interface WorkerRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  rps?: number;
}

interface WorkerResponse {
  id: string;
  status: number;
  statusText: string;
  data: string;
  time: number;
  headers: Record<string, string | string[]>;
  error?: string;
}

if (!parentPort) {
  throw new Error('Runner worker must be loaded via worker_threads');
}

parentPort.on('message', async (task: WorkerRequest) => {
  try {
    const result = await executeHttpRequest(task);
    parentPort!.postMessage({ id: task.id, data: result });
  } catch (err: any) {
    parentPort!.postMessage({ id: task.id, error: err.message });
  }
});

async function executeHttpRequest(options: WorkerRequest): Promise<WorkerResponse> {
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

      for (const [key, value] of Object.entries(response.headers)) {
        if (value !== undefined) {
          responseHeaders[key] = value;
        }
      }

      response.on('data', (chunk) => {
        responseBody += chunk.toString();
      });

      response.on('end', () => {
        resolve({
          id: options.id,
          status: statusCode,
          statusText,
          headers: responseHeaders,
          data: responseBody,
          time: Date.now() - startTime,
        });
      });
    });

    request.on('error', (error) => {
      resolve({
        id: options.id,
        status: 0,
        statusText: 'Error',
        headers: {},
        data: '',
        time: Date.now() - startTime,
        error: error.message,
      });
    });

    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      request.write(options.body);
    }
    request.end();
  });
}