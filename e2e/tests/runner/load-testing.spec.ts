import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { RunnerPanel } from '../fixtures/page-objects/RunnerPanel';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';

test.describe('Load Testing Functionality', () => {
  let appLayout: AppLayout;
  let runnerPanel: RunnerPanel;
  let collectionsPanel: CollectionsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    runnerPanel = new RunnerPanel(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Load Test Collection');
  });

  test('should initialize load testing service', async () => {
    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Load Test Init', 'Load Test Collection');
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Test Request');
    await runnerPanel.selectRequest('Test Request');

    // Load testing should be initialized when runner is used
    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    // Verify that load testing data is being recorded
    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(0);
  });

  test('should record request metrics during load test', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Metrics Test Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Metrics Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Metrics Test Request');
    await runnerPanel.setRequestRPS('Metrics Test Request', 5);
    await runnerPanel.enableRepeatedRun(3); // 3 seconds

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(5); // Should have multiple requests

    // Verify all results have timing information
    results.forEach(result => {
      expect(result.time).toBeGreaterThan(0);
      expect([200, 0]).toContain(result.status); // Either success or error
    });
  });

  test('should apply rate limiting correctly', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Rate Limited Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Rate Limit Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Rate Limited Request');
    await runnerPanel.setRequestRPS('Rate Limited Request', 2); // 2 requests per second
    await runnerPanel.enableRepeatedRun(2); // 2 seconds

    const startTime = Date.now();
    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();
    const endTime = Date.now();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(2); // Should have at least 3-4 requests

    // Verify timing is reasonable for rate limiting
    const totalDuration = endTime - startTime;
    expect(totalDuration).toBeGreaterThan(1500); // Should take at least 1.5 seconds
  });

  test('should handle concurrent requests with different RPS', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Fast Request');
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Slow Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Concurrent RPS Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Fast Request');
    await runnerPanel.selectRequest('Slow Request');

    await runnerPanel.setRequestRPS('Fast Request', 10);
    await runnerPanel.setRequestRPS('Slow Request', 2);
    await runnerPanel.enableRepeatedRun(2);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(15); // Should have many fast + some slow requests

    const fastRequests = results.filter(r => r.method === 'GET' && results.indexOf(r) % 2 === 0).length;
    const slowRequests = results.filter(r => r.method === 'GET' && results.indexOf(r) % 2 === 1).length;

    expect(fastRequests).toBeGreaterThan(slowRequests); // Fast request should have more executions
  });

  test('should collect and display performance statistics', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Stats Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Stats Collection Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Stats Request');
    await runnerPanel.setRequestRPS('Stats Request', 5);
    await runnerPanel.enableRepeatedRun(2);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    // Navigate to stats to verify data is recorded
    await appLayout.navigateToStats();

    // Should show load test data
    const hasData = await appLoaded.locator('.stats-panel').locator('text=No load test data available').isHidden();
    expect(hasData).toBe(true);

    // Should have charts visible
    const chartContainers = appLoaded.locator('.chart-container');
    await expect(chartContainers).toHaveCount(3); // Requests, Errors, Response Time charts
  });

  test('should export load test results', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Export Test Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Export Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Export Test Request');
    await runnerPanel.setRequestRPS('Export Test Request', 3);
    await runnerPanel.enableRepeatedRun(2);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    // Navigate to stats and test export functionality
    await appLayout.navigateToStats();

    // Test JSON export button
    const exportJsonBtn = appLoaded.locator('button:has-text("Export JSON")');
    await expect(exportJsonBtn).toBeVisible();

    // Test print button
    const printBtn = appLoaded.locator('button:has-text("Print")');
    await expect(printBtn).toBeVisible();
  });

  test('should handle load test failures and error rates', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Success Request');
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Fail Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Error Rate Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Success Request');
    await runnerPanel.selectRequest('Fail Request');

    // Set invalid URL for fail request
    await runnerPanel.setRequestUrl('Fail Request', 'https://invalid-domain-999999.com');

    await runnerPanel.setRequestRPS('Success Request', 3);
    await runnerPanel.setRequestRPS('Fail Request', 3);
    await runnerPanel.enableRepeatedRun(2);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();

    const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
    const errorCount = results.filter(r => r.status === 0 || r.status >= 500).length;

    expect(successCount).toBeGreaterThan(0);
    expect(errorCount).toBeGreaterThan(0);
    expect(successCount + errorCount).toBe(results.length);
  });

  test('should support data-driven testing with CSV files', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Data Driven Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Data Driven Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Data Driven Request');

    // Mock CSV file selection
    await runnerPanel.mockFileSelection('Data Driven Request', '/path/to/test-data.csv');

    await runnerPanel.setRequestRPS('Data Driven Request', 2);
    await runnerPanel.enableRepeatedRun(2);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(2); // Should execute multiple times with data variations
  });

  test('should persist load test runs between sessions', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'Persistence Test Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Persistence Test', 'Load Test Collection');
    await runnerPanel.selectRequest('Persistence Test Request');

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    // Simulate app restart by reloading
    await appLoaded.reload();
    await appLayout.waitForLoad();

    // Navigate back to stats
    await appLayout.navigateToStats();

    // Should still show previous run data
    const hasData = await appLoaded.locator('.stats-panel').locator('text=No load test data available').isHidden();
    expect(hasData).toBe(true);
  });

  test('should handle high concurrency load tests', async () => {
    await collectionsPanel.addRequestToCollection('Load Test Collection', 'High Concurrency Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('High Concurrency Test', 'Load Test Collection');
    await runnerPanel.selectRequest('High Concurrency Request');

    await runnerPanel.setRequestRPS('High Concurrency Request', 20); // High RPS
    await runnerPanel.enableRepeatedRun(3);

    const startTime = Date.now();
    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();
    const endTime = Date.now();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(30); // Should have many requests

    // Verify timing is controlled
    const totalDuration = endTime - startTime;
    expect(totalDuration).toBeGreaterThan(2500); // Should take at least 2.5 seconds
    expect(totalDuration).toBeLessThan(5000); // Shouldn't take too long
  });
});