import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

test.describe('Request Execution', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Test Collection');
  });

  test('should execute GET request successfully', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'GET Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });

  test('should execute POST request with body', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'POST Request');
    await requestPanel.setMethod('POST');
    await requestPanel.setUrl('https://httpbin.org/post');
    await requestPanel.addHeader('Content-Type', 'application/json');
    await requestPanel.setBody('{"test": "data"}', 'json');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('{"test": "data"}');
  });

  test('should handle request with authentication', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Auth Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/bearer');
    await requestPanel.setAuth('bearer', { token: 'test-token' });

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });

  test('should display response time', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Timing Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/delay/1');

    await requestPanel.sendRequest();

    const time = await requestPanel.getResponseTime();
    expect(time).toMatch(/\d+ms/);
  });

  test('should handle 404 errors', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', '404 Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/status/404');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('404');
  });

  test('should handle network timeouts', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Timeout Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/delay/30'); // Long delay

    // This might timeout based on test config
    try {
      await requestPanel.sendRequest();
      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200'); // Or timeout error
    } catch (error) {
      expect(error.message).toContain('timeout');
    }
  });

  test('should execute requests with query parameters', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Query Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get?param1=value1&param2=value2');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('param1');
    expect(body).toContain('value1');
  });

  test('should handle large response bodies', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Large Response');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/bytes/10000'); // 10KB response

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body.length).toBeGreaterThan(1000);
  });

  test('should execute PUT request', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'PUT Request');
    await requestPanel.setMethod('PUT');
    await requestPanel.setUrl('https://httpbin.org/put');
    await requestPanel.setBody('{"updated": true}', 'json');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });

  test('should execute DELETE request', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'DELETE Request');
    await requestPanel.setMethod('DELETE');
    await requestPanel.setUrl('https://httpbin.org/delete');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });

  test('should handle invalid URL with method prefix', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Invalid URL Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('GET https://fake-json-api.mock.beeceptor.com/users');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('0');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('method should be selected from dropdown');
  });

  test('should handle unsupported protocol', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Unsupported Protocol Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('tttp://api.restful-api.dev/objects');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('0');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('Unsupported protocol');
  });

  test('should show Send button again after error', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Error Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('GET https://example.com/invalid');

    await requestPanel.setUrl('GET https://example.com/invalid');
    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('0');

    // Verify button is clickable again (Send text should be visible)
    const sendBtn = requestPanel.sendBtn;
    await expect(sendBtn).toHaveText('Send');
  });
});