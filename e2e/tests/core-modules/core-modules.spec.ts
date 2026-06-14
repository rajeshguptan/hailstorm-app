import { test, expect } from '../fixtures/base.fixture';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';
import { RunnerPanel } from '../fixtures/page-objects/RunnerPanel';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { EnvironmentsPanel } from '../fixtures/page-objects/EnvironmentsPanel';

test.describe('Refactored Execution Engine Core Modules', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;
  let runnerPanel: RunnerPanel;
  let environmentsPanel: EnvironmentsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    runnerPanel = new RunnerPanel(appLoaded);
    environmentsPanel = new EnvironmentsPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Module Test Collection');
  });

  test.describe('HTTP Request Handling (httpClient.ts)', () => {
    test('should handle GET requests via refactored httpClient module', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/get');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should handle POST requests via refactored httpClient module', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('POST');
      await requestPanel.setUrl('https://httpbin.org/post');
      await requestPanel.setBody('{"test": "refactored"}', 'json');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should handle PUT requests', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('PUT');
      await requestPanel.setUrl('https://httpbin.org/put');
      await requestPanel.setBody('{"updated": true}', 'json');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should handle DELETE requests', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('DELETE');
      await requestPanel.setUrl('https://httpbin.org/delete');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });
  });

  test.describe('Authentication Handling (authHandler.ts)', () => {
    test('should apply bearer token authentication correctly', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/bearer');
      await requestPanel.setAuth('bearer', { token: 'test-bearer-token' });

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should apply basic authentication correctly', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/basic-auth/user/pass');
      await requestPanel.setAuth('basic', { username: 'user', password: 'pass' });

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should apply API key authentication in header', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/headers');
      await requestPanel.setAuth('apikey', { key: 'X-API-Key', value: 'test-api-key', in: 'header' });

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should apply API key authentication in query', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/get');
      await requestPanel.setAuth('apikey', { key: 'api_key', value: 'test-key', in: 'query' });

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });
  });

  test.describe('Variable Substitution (authHandler.ts)', () => {
    test('should substitute environment variables in URL', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      
      await appLayout.navigateToEnvironments();
      await environmentsPanel.addEnvironment('Var Env');
      
      // Add variable to environment
      await environmentsPanel.addVariable('base_url', 'httpbin.org');
      await appLayout.navigateToCollections();
      
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://{{base_url}}/get');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should handle request with query parameters', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/get?param1=value1&param2=value2');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });
  });

  test.describe('Rate Limiting (httpExecutor.ts)', () => {
    test('should apply rate limiting via TokenBucket', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      
      await appLayout.navigateToRunner();
      await runnerPanel.createRunConfig('Rate Limit Test', 'Module Test Collection');
      await runnerPanel.selectRequest('Module Test Collection');
      await runnerPanel.setRequestRPS('Module Test Collection', 5);
      await runnerPanel.enableRepeatedRun(2);

      await runnerPanel.runCollection();
      await runnerPanel.waitForRunCompletion();

      const results = await runnerPanel.getResults();
      expect(results.length).toBeGreaterThan(5);
    });
  });

  test.describe('Load Testing Service (loadTestingService.ts)', () => {
    test('should initialize load testing service and record metrics', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      
      await appLayout.navigateToRunner();
      await runnerPanel.createRunConfig('Init Load Test', 'Module Test Collection');
      await runnerPanel.selectRequest('Module Test Collection');

      await runnerPanel.runCollection();
      await runnerPanel.waitForRunCompletion();

      // Verify load testing service recorded data
      await appLayout.navigateToStats();
      const hasData = await appLoaded.locator('.stats-panel').locator('text=No load test data available').isHidden();
      expect(hasData).toBe(true);
    });

    test('should record load test metrics with timing information', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      
      await appLayout.navigateToRunner();
      await runnerPanel.createRunConfig('Metrics Test', 'Module Test Collection');
      await runnerPanel.selectRequest('Module Test Collection');
      await runnerPanel.setRequestRPS('Module Test Collection', 10);
      await runnerPanel.enableRepeatedRun(1);

      await runnerPanel.runCollection();
      await runnerPanel.waitForRunCompletion();

      const results = await runnerPanel.getResults();
      expect(results.length).toBeGreaterThan(5);
      
      // Verify all results have timing
      results.forEach(r => {
        expect(r.time).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Module Integration', () => {
    test('should maintain backward compatibility for sendRequest export', async ({ appLoaded }) => {
      // This test verifies that requestExecutor.ts properly exports sendRequest
      // which is used by ipcHandlers.ts for 'send-request' IPC handler
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/get');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should handle request with multiple auth types', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/headers');
      await requestPanel.setAuth('bearer', { token: 'test-token' });
      await requestPanel.addHeader('X-Custom', 'value');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should handle 404 errors gracefully', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/status/404');

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('404');
    });

    test('should handle large response bodies', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/bytes/10000'); // 10KB response

      await requestPanel.sendRequest();

      const status = await requestPanel.getResponseStatus();
      expect(status).toContain('200');
    });

    test('should display response time after request', async ({ appLoaded }) => {
      await collectionsPanel.addRequestToCollection('Module Test Collection');
      await requestPanel.setMethod('GET');
      await requestPanel.setUrl('https://httpbin.org/delay/1');

      await requestPanel.sendRequest();

      const time = await requestPanel.getResponseTime();
      expect(time).toMatch(/\d+ms/);
    });
  });
});