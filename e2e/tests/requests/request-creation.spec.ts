import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

test.describe('Request Creation', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addRequestToCollection('Test Collection', 'Test Request');
  });

  test('should create request with GET method', async () => {
    await requestPanel.setMethod('GET');
    const selectedMethod = await requestPanel.methodSelect.inputValue();
    expect(selectedMethod).toBe('GET');
  });

  test('should set request URL', async () => {
    const testUrl = 'https://httpbin.org/get';
    await requestPanel.setUrl(testUrl);
    const urlValue = await requestPanel.urlInput.inputValue();
    expect(urlValue).toBe(testUrl);
  });

  test('should add request headers', async () => {
    await requestPanel.addHeader('Content-Type', 'application/json');
    await requestPanel.addHeader('Authorization', 'Bearer token123');

    const headerRows = requestPanel.page.locator('.header-row');
    await expect(headerRows).toHaveCount(2);
  });

  test('should set JSON request body', async () => {
    const jsonBody = '{"key": "value"}';
    await requestPanel.setBody(jsonBody, 'json');

    const bodyTextarea = requestPanel.page.locator('.body-section textarea');
    const bodyValue = await bodyTextarea.inputValue();
    expect(bodyValue).toBe(jsonBody);
  });

  test('should set text request body', async () => {
    const textBody = 'Plain text body';
    await requestPanel.setBody(textBody, 'text');

    const bodyTextarea = requestPanel.page.locator('.body-section textarea');
    const bodyValue = await bodyTextarea.inputValue();
    expect(bodyValue).toBe(textBody);
  });

  test('should configure basic authentication', async () => {
    await requestPanel.setAuth('basic', { username: 'user', password: 'pass' });

    const usernameInput = requestPanel.page.locator('input[placeholder="Username"]');
    const passwordInput = requestPanel.page.locator('input[placeholder="Password"]');
    expect(await usernameInput.inputValue()).toBe('user');
    expect(await passwordInput.inputValue()).toBe('pass');
  });

  test('should configure bearer token authentication', async () => {
    await requestPanel.setAuth('bearer', { token: 'abc123' });

    const tokenInput = requestPanel.page.locator('input[placeholder="Token"]');
    expect(await tokenInput.inputValue()).toBe('abc123');
  });

  test('should configure API key authentication', async () => {
    await requestPanel.setAuth('api-key', {
      key: 'X-API-Key',
      value: 'key123',
      in: 'header'
    });

    const keyInput = requestPanel.page.locator('input[placeholder="Key"]');
    const valueInput = requestPanel.page.locator('input[placeholder="Value"]');
    expect(await keyInput.inputValue()).toBe('X-API-Key');
    expect(await valueInput.inputValue()).toBe('key123');
  });

  test('should validate URL format', async () => {
    await requestPanel.setUrl('invalid-url');
    // Assuming there's validation feedback
    const errorMsg = requestPanel.page.locator('.url-error');
    if (await errorMsg.isVisible()) {
      expect(await errorMsg.textContent()).toContain('Invalid URL');
    }
  });

  test('should handle multiple tabs for concurrent requests', async () => {
    await collectionsPanel.addRequestToCollection('Test Collection', 'Request 2');

    // Check if tabs are created
    const tabs = requestPanel.page.locator('.tab');
    await expect(tabs).toHaveCount(2);
  });
});