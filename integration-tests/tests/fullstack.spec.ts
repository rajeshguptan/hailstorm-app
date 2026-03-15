import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3001';

test.describe('Full Stack Integration', () => {
  test('tRPC endpoint returns valid response for GET request', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/trpc/makeRequest`, {
      data: {
        method: 'GET',
        url: 'https://httpbin.org/get',
        headers: { 'User-Agent': 'Playwright-Test' },
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
    expect(json.result.data.time).toBeGreaterThan(0);
  });

  test('tRPC endpoint handles POST with JSON body', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/trpc/makeRequest`, {
      data: {
        method: 'POST',
        url: 'https://httpbin.org/post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
    const responseData = JSON.parse(json.result.data.data);
    expect(responseData.json).toEqual({ test: 'data' });
  });

  test('tRPC endpoint handles network errors gracefully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/trpc/makeRequest`, {
      data: {
        method: 'GET',
        url: 'https://this-domain-does-not-exist-123456789.com',
        headers: {},
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(0);
    expect(json.result.data.error).toBeDefined();
  });

  test('end-to-end: request flows through backend correctly', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/trpc/makeRequest`, {
      data: {
        method: 'POST',
        url: 'https://httpbin.org/anything',
        headers: { 'X-Custom-Test': 'test-value' },
        body: JSON.stringify({ message: 'hello from test' }),
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
    
    const responseData = JSON.parse(json.result.data.data);
    expect(responseData.headers['X-Custom-Test']).toBe('test-value');
    expect(responseData.json).toEqual({ message: 'hello from test' });
  });
});
