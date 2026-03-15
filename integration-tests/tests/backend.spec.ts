import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3001';

test.describe('Backend tRPC API', () => {
  test('makeRequest - GET request returns 200', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/trpc/makeRequest`, {
      data: {
        method: 'GET',
        url: 'https://httpbin.org/get',
        headers: {},
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
    expect(json.result.data.statusText).toBe('OK');
  });

  test('makeRequest - POST request with JSON body', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3001/trpc/makeRequest', {
      data: {
        method: 'POST',
        url: 'https://httpbin.org/post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test', value: 123 }),
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
    const data = JSON.parse(json.result.data.data);
    expect(data.json).toEqual({ name: 'test', value: 123 });
  });

  test('makeRequest - PUT request', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3001/trpc/makeRequest', {
      data: {
        method: 'PUT',
        url: 'https://httpbin.org/put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update: true }),
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
  });

  test('makeRequest - DELETE request', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3001/trpc/makeRequest', {
      data: {
        method: 'DELETE',
        url: 'https://httpbin.org/delete',
        headers: {},
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(200);
  });

  test('makeRequest - returns response time', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3001/trpc/makeRequest', {
      data: {
        method: 'GET',
        url: 'https://httpbin.org/get',
        headers: {},
      },
    });

    const json = await response.json();
    expect(json.result.data.time).toBeGreaterThan(0);
  });

  test('makeRequest - handles custom headers', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3001/trpc/makeRequest', {
      data: {
        method: 'GET',
        url: 'https://httpbin.org/headers',
        headers: {
          'X-Custom-Header': 'custom-value',
          'Authorization': 'Bearer test-token',
        },
      },
    });

    const json = await response.json();
    const data = JSON.parse(json.result.data.data);
    expect(data.headers['X-Custom-Header']).toBe('custom-value');
    expect(data.headers['Authorization']).toBe('Bearer test-token');
  });

  test('makeRequest - invalid URL returns error', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3001/trpc/makeRequest', {
      data: {
        method: 'GET',
        url: 'https://invalid-domain-that-does-not-exist-12345.com',
        headers: {},
      },
    });

    const json = await response.json();
    expect(json.result.data.status).toBe(0);
    expect(json.result.data.error).toBeDefined();
  });
});
