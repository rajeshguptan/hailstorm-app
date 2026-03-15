import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

const requestOptionsSchema = z.object({
  method: z.string(),
  url: z.string(),
  headers: z.record(z.string()),
  body: z.string().optional(),
});

export const appRouter = router({
  makeRequest: publicProcedure
    .input(requestOptionsSchema)
    .mutation(async ({ input }) => {
      console.log('[BACKEND] makeRequest received', { method: input.method, url: input.url, headers: input.headers });
      return new Promise((resolve) => {
        const startTime = Date.now();
        const parsedUrl = new URL(input.url);
        
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options: http.RequestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: input.method,
          headers: input.headers,
        };

        const request = httpModule.request(options);

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
            console.log('[BACKEND] makeRequest completed', { status: statusCode, statusText: statusMessage, time: endTime - startTime });
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
          console.error('[BACKEND] makeRequest error', error.message);
          resolve({
            status: 0,
            statusText: 'Error',
            headers: {},
            data: '',
            error: error.message,
            time: Date.now() - startTime,
          });
        });

        if (input.body && ['POST', 'PUT', 'PATCH'].includes(input.method)) {
          request.write(input.body);
        }

        request.end();
      });
    }),
});

export type AppRouter = typeof appRouter;
