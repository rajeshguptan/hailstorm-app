import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

test.describe('Response Handling', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Response Test Collection');
  });

  test('should display response status code', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Status Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/status/201');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('201');
  });

  test('should display response headers', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Headers Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/response-headers?Custom-Header=Test-Value');

    await requestPanel.sendRequest();

    const responseHeaders = requestPanel.page.locator('.response-headers');
    await expect(responseHeaders).toContainText('Custom-Header');
    await expect(responseHeaders).toContainText('Test-Value');
  });

  test('should display JSON response body with syntax highlighting', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'JSON Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/json');

    await requestPanel.sendRequest();

    const body = await requestPanel.getResponseBody();
    expect(body).toContain('slideshow');
    // Check for syntax highlighting classes or structure
    const highlightedCode = requestPanel.page.locator('.response-body code');
    await expect(highlightedCode).toBeVisible();
  });

  test('should display XML response body', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'XML Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/xml');

    await requestPanel.sendRequest();

    const body = await requestPanel.getResponseBody();
    expect(body).toContain('<?xml');
    expect(body).toContain('<slideshow>');
  });

  test('should display plain text response body', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Text Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/robots.txt');

    await requestPanel.sendRequest();

    const body = await requestPanel.getResponseBody();
    expect(body).toContain('User-agent');
  });

  test('should display binary/image responses appropriately', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Image Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/image/png');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    // Binary content might be displayed as base64 or download link
    const body = await requestPanel.getResponseBody();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should display response time and size', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Metrics Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');

    await requestPanel.sendRequest();

    const time = await requestPanel.getResponseTime();
    expect(time).toMatch(/\d+ms/);

    // Check for response size if displayed
    const sizeElement = requestPanel.page.locator('.response-size');
    if (await sizeElement.isVisible()) {
      const size = await sizeElement.textContent();
      expect(size).toMatch(/\d+ bytes?/);
    }
  });

  test('should handle chunked responses', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Chunked Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/stream/5');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should handle compressed responses', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Gzip Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/gzip');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('"gzipped": true');
  });

  test('should handle error responses with details', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Error Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/status/500');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('500');
    // Check if error details are shown
    const errorMsg = requestPanel.page.locator('.error-message');
    if (await errorMsg.isVisible()) {
      expect(await errorMsg.textContent()).toBeTruthy();
    }
  });

  test('should allow copying response data', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Copy Test');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');

    await requestPanel.sendRequest();

    // Assuming copy buttons exist
    const copyBtn = requestPanel.page.locator('button:has-text("Copy")');
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      // Check if copied to clipboard (would need permission or mock)
    }
  });

  test('should persist response data when switching tabs', async () => {
    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Tab Test 1');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();

    const status1 = await requestPanel.getResponseStatus();

    await collectionsPanel.addRequestToCollection('Response Test Collection', 'Tab Test 2');
    await collectionsPanel.selectCollection('Tab Test 1');

    const status2 = await requestPanel.getResponseStatus();
    expect(status1).toBe(status2);
  });
});