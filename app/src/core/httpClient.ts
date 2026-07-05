import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import fs from 'fs';
import type { Auth } from '../types';
import { TokenBucket } from './httpExecutor';

const tokenBuckets = new Map<string, TokenBucket>();

export async function makeHttpRequest(options: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  rps?: number;
  requestId?: string;
  auth?: Auth;
}): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: string;
  time: number;
  error?: string;
}> {
  return new Promise(async (resolve) => {
    const startTime = Date.now();

    if (options.rps && options.rps > 0 && options.requestId) {
      const requestId = options.requestId;

      if (!tokenBuckets.has(requestId)) {
        tokenBuckets.set(requestId, new TokenBucket(options.rps));
      }

      const bucket = tokenBuckets.get(requestId)!;

      if (bucket.rps !== options.rps) {
        bucket.setRps(options.rps);
      }

      await bucket.consumeWait();
      console.log(`[RATE LIMIT] ${requestId}: TOKEN CONSUMED (${bucket.tokens.toFixed(2)} tokens remaining)`);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(options.url);
    } catch (urlError: any) {
      console.error('[EXECUTION_ENGINE] Invalid URL:', urlError.message);
      let errorMsg = urlError.message;
      if (/^GET |^POST |^PUT |^DELETE |^PATCH |^HEAD /i.test(options.url)) {
        errorMsg = 'Invalid URL: method should be selected from dropdown, not typed in URL field';
      } else {
        errorMsg = `Invalid URL: ${urlError.message}`;
      }
      resolve({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: '',
        error: errorMsg,
        time: Date.now() - startTime,
      });
      return;
    }

    // Validate protocol - only http and https are supported
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      resolve({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: '',
        error: `Unsupported protocol: ${parsedUrl.protocol}. Only http and https are supported.`,
        time: Date.now() - startTime,
      });
      return;
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestOptions: http.RequestOptions & { pfx?: Buffer; passphrase?: string; key?: Buffer; cert?: Buffer } = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
    };

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

    if (options.auth?.type === 'ntlm' && options.auth.ntlm) {
      const ntlmConfig = options.auth.ntlm;
      const domain = ntlmConfig.domain || '';
      const username = ntlmConfig.username || '';
      const password = ntlmConfig.password || '';
      const workstation = ntlmConfig.workstation || '';

      const negotiateMsg = createNtlmNegotiateMessage(domain, username, workstation);
      (requestOptions.headers as Record<string, string>)['Authorization'] = `NTLM ${negotiateMsg}`;
      
      let ntlmRequest: http.ClientRequest;
      try {
        ntlmRequest = httpModule.request(requestOptions, async (response) => {
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
      } catch (requestError: any) {
        resolve({
          status: 0,
          statusText: 'Error',
          headers: {},
          data: '',
          error: requestError.message,
          time: Date.now() - startTime,
        });
        return;
      }

      ntlmRequest.on('error', (error) => {
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
        ntlmRequest.write(options.body);
      }
      ntlmRequest.end();
      return;
    }

    let request: http.ClientRequest;
    try {
      request = httpModule.request(requestOptions);
    } catch (requestError: any) {
      console.error('[EXECUTION_ENGINE] Request setup error:', requestError.message);
      resolve({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: '',
        error: requestError.message,
        time: Date.now() - startTime,
      });
      return;
    }

    let responseBody = '';
    let responseHeaders: Record<string, string | string[]> = {};
    let statusCode = 0;
    let statusMessage = '';

    // Add timeout to prevent hanging requests
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => {
      request.destroy();
      resolve({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: '',
        error: `Request timed out after ${timeoutMs}ms`,
        time: Date.now() - startTime,
      });
    }, timeoutMs);

    request.on('response', (response) => {
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
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

function createNtlmNegotiateMessage(domain: string, username: string, workstation: string): string {
  const body = Buffer.alloc(40);
  body.writeUInt8(1, 0);
  body.write(domain || '', 12, 'utf8');
  body.write(username || '', 20, 'utf8');
  body.write(workstation || '', 28, 'utf8');
  return body.toString('base64');
}