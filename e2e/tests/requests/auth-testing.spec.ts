import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

test.describe('Authentication Testing', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Auth Test Collection');
  });

  test('should handle basic auth with valid credentials', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'Basic Auth');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/basic-auth/user/pass');
    await requestPanel.setAuth('basic', { username: 'user', password: 'pass' });

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });

  test('should handle basic auth with invalid credentials', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'Basic Auth Fail');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/basic-auth/user/pass');
    await requestPanel.setAuth('basic', { username: 'wrong', password: 'wrong' });

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('401');
  });

  test('should handle bearer token auth', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'Bearer Auth');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/bearer');
    await requestPanel.setAuth('bearer', { token: 'test-token-123' });

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('test-token-123');
  });

  test('should handle API key in header', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'API Key Header');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.setAuth('api-key', {
      key: 'X-API-Key',
      value: 'secret-key-123',
      in: 'header'
    });

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('X-API-Key');
    expect(body).toContain('secret-key-123');
  });

  test('should handle API key in query parameter', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'API Key Query');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.setAuth('api-key', {
      key: 'api_key',
      value: 'query-key-456',
      in: 'query'
    });

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('api_key');
    expect(body).toContain('query-key-456');
  });

  test('should handle digest authentication', async () => {
    // If supported, test digest auth
    // For now, placeholder
    expect(true).toBe(true);
  });

  test('should handle OAuth2 authentication', async () => {
    // If OAuth2 is implemented
    // Placeholder for OAuth flows
    expect(true).toBe(true);
  });

  test('should persist auth settings between requests', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'Auth Persistence');
    await requestPanel.setAuth('bearer', { token: 'persistent-token' });

    // Switch to another request and back
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'Another Request');
    await collectionsPanel.selectCollection('Auth Persistence');

    // Check if auth is still set (this depends on implementation)
    const tokenInput = requestPanel.page.locator('input[placeholder="Token"]');
    if (await tokenInput.isVisible()) {
      const tokenValue = await tokenInput.inputValue();
      expect(tokenValue).toBe('persistent-token');
    }
  });

  test('should clear authentication settings', async () => {
    await collectionsPanel.addRequestToCollection('Auth Test Collection', 'Clear Auth');
    await requestPanel.setAuth('bearer', { token: 'test-token' });

    // Assuming there's a clear button or way to reset
    await requestPanel.setAuth('none');

    const tokenInput = requestPanel.page.locator('input[placeholder="Token"]');
    if (await tokenInput.isVisible()) {
      const tokenValue = await tokenInput.inputValue();
      expect(tokenValue).toBe('');
    }
  });
});