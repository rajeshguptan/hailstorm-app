import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RunnerPanel } from '../fixtures/page-objects/RunnerPanel';

test.describe('Collection Runner', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let runnerPanel: RunnerPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    runnerPanel = new RunnerPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Runner Test Collection');
  });

  test('should create and select a run configuration', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request');
    await appLayout.navigateToRunner();

    // Create a new run configuration
    await runnerPanel.createRunConfig('Test Run Config', 'Runner Test Collection');

    // Verify run config is created and selected
    const configName = await runnerPanel.getSelectedConfigName();
    expect(configName).toBe('Test Run Config');
  });

  test('should run a single request successfully', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request');
    await appLayout.navigateToRunner();

    await runnerPanel.createRunConfig('Single Request Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('GET Request');

    await runnerPanel.runCollection();

    // Wait for completion
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBe(1);
    expect(results[0].status).toBe(200);
    expect(results[0].method).toBe('GET');
  });

  test('should run multiple requests sequentially', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request 1');
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'POST Request 2');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Multiple Requests Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('GET Request 1');
    await runnerPanel.selectRequest('POST Request 2');

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBe(2);
    expect(results[0].method).toBe('GET');
    expect(results[1].method).toBe('POST');
  });

  test('should configure and run requests with different RPS', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request 1');
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request 2');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('RPS Test Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('GET Request 1');
    await runnerPanel.selectRequest('GET Request 2');

    // Set different RPS for each request
    await runnerPanel.setRequestRPS('GET Request 1', 2);
    await runnerPanel.setRequestRPS('GET Request 2', 5);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(1); // Should have multiple requests due to RPS
  });

  test('should run repeated load test for specified duration', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'Load Test Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Duration Test Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('Load Test Request');
    await runnerPanel.setRequestRPS('Load Test Request', 10);

    // Enable repeated run with 5 second duration
    await runnerPanel.enableRepeatedRun(5);

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBeGreaterThan(1); // Should have multiple requests over 5 seconds
  });

  test('should handle request failures gracefully', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request');
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'Invalid Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Failure Test Run', 'Runner Test Collection');

    // Set invalid URL for second request
    await runnerPanel.selectRequest('GET Request');
    await runnerPanel.selectRequest('Invalid Request');
    await runnerPanel.setRequestUrl('Invalid Request', 'https://invalid-domain-that-does-not-exist-12345.com');

    await runnerPanel.runCollection();
    await runnerPanel.waitForRunCompletion();

    const results = await runnerPanel.getResults();
    expect(results.length).toBe(2);

    // One should succeed, one should fail
    const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
    const failureCount = results.filter(r => r.status === 0 || r.status >= 500).length;
    expect(successCount + failureCount).toBe(2);
  });

  test('should stop running test when stop button is clicked', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'Long Running Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Stop Test Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('Long Running Request');

    // Set up a long-running repeated test
    await runnerPanel.enableRepeatedRun(30); // 30 seconds
    await runnerPanel.setRequestRPS('Long Running Request', 1);

    await runnerPanel.runCollection();

    // Wait a moment then stop
    await appLoaded.waitForTimeout(2000);
    await runnerPanel.stopRun();

    // Verify run was stopped
    const isRunning = await runnerPanel.isRunning();
    expect(isRunning).toBe(false);
  });

  test('should edit run configuration', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request 1');
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request 2');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Edit Test Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('GET Request 1');

    // Enter edit mode
    await runnerPanel.startEdit();
    await runnerPanel.setConfigName('Edited Test Run');
    await runnerPanel.selectRequest('GET Request 2'); // Add second request
    await runnerPanel.saveConfig();

    // Verify changes were saved
    const configName = await runnerPanel.getSelectedConfigName();
    expect(configName).toBe('Edited Test Run');
  });

  test('should duplicate run configuration', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'GET Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Original Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('GET Request');

    await runnerPanel.duplicateConfig('Duplicated Run');

    // Should have two configs now
    const configs = await runnerPanel.getAvailableConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(2);
    expect(configs.some(name => name === 'Duplicated Run')).toBe(true);
  });

  test('should select data file for request', async () => {
    await collectionsPanel.addRequestToCollection('Runner Test Collection', 'Data Driven Request');

    await appLayout.navigateToRunner();
    await runnerPanel.createRunConfig('Data Test Run', 'Runner Test Collection');
    await runnerPanel.selectRequest('Data Driven Request');

    // Mock the file selection dialog
    await runnerPanel.mockFileSelection('Data Driven Request', '/path/to/test-data.csv');

    const dataFile = await runnerPanel.getRequestDataFile('Data Driven Request');
    expect(dataFile).toBe('/path/to/test-data.csv');
  });
});