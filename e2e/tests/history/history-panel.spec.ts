import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';
import { HistoryPanel } from '../fixtures/page-objects/HistoryPanel';

test.describe('History Panel', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;
  let historyPanel: HistoryPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    historyPanel = new HistoryPanel(appLoaded);
  });

  test('should display empty state when no requests have been made', async () => {
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    expect(await historyPanel.isEmpty()).toBe(true);
    const emptyText = await historyPanel.getEmptyStateText();
    expect(emptyText).toContain('No requests yet');
  });

  test('should display request history after making requests', async () => {
    // Make some requests first
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('History Test Collection');
    await collectionsPanel.addRequestToCollection('History Test Collection', 'GET Test Request');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Navigate to history
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    expect(await historyPanel.isEmpty()).toBe(false);
    const itemCount = await historyPanel.getHistoryItemCount();
    expect(itemCount).toBeGreaterThanOrEqual(1);
  });

  test('should display correct request information in history', async () => {
    // Make a request
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('History Details Collection');
    await collectionsPanel.addRequestToCollection('History Details Collection', 'POST Test Request');

    await requestPanel.setMethod('POST');
    await requestPanel.setUrl('https://httpbin.org/post');
    await requestPanel.addHeader('Content-Type', 'application/json');
    await requestPanel.setBody('{"test": "data"}', 'json');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Check history
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    const historyItem = await historyPanel.getHistoryItem(0);
    expect(historyItem.method).toBe('POST');
    expect(historyItem.url).toContain('httpbin.org/post');
    expect(historyItem.status).toBe(200);
    expect(historyItem.time).toBeGreaterThan(0);
    expect(historyItem.timestamp).toBeTruthy();
  });

  test('should show relative timestamps for recent requests', async () => {
    // Make a request
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Timestamp Test Collection');
    await collectionsPanel.addRequestToCollection('Timestamp Test Collection', 'Timestamp Test');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Check timestamp format
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    const historyItem = await historyPanel.getHistoryItem(0);
    const timestamp = historyItem.timestamp.toLowerCase();
    expect(['just now', 'm ago', 'h ago', 'd ago'].some(unit =>
      timestamp.includes(unit)
    )).toBe(true);
  });

  test('should search history by URL', async () => {
    // Make multiple requests with different URLs
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Search Test Collection');
    await collectionsPanel.addRequestToCollection('Search Test Collection', 'Request 1');
    await collectionsPanel.addRequestToCollection('Search Test Collection', 'Request 2');

    // Request 1 - httpbin
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Request 2 - different URL
    await collectionsPanel.selectRequest('Request 2');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/uuid');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Search for httpbin
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();
    await historyPanel.searchHistory('httpbin');

    const itemCount = await historyPanel.getHistoryItemCount();
    expect(itemCount).toBe(2); // Both should match

    // Search for uuid
    await historyPanel.searchHistory('uuid');
    const uuidCount = await historyPanel.getHistoryItemCount();
    expect(uuidCount).toBe(1); // Only one should match
  });

  test('should search history by HTTP method', async () => {
    // Make requests with different methods
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Method Search Collection');
    await collectionsPanel.addRequestToCollection('Method Search Collection', 'GET Request');
    await collectionsPanel.addRequestToCollection('Method Search Collection', 'POST Request');

    // GET request
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // POST request
    await collectionsPanel.selectRequest('POST Request');
    await requestPanel.setMethod('POST');
    await requestPanel.setUrl('https://httpbin.org/post');
    await requestPanel.setBody('{"test": true}', 'json');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Search by method
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    await historyPanel.searchHistory('GET');
    let getCount = await historyPanel.getHistoryItemCount();
    expect(getCount).toBe(1);

    await historyPanel.searchHistory('POST');
    let postCount = await historyPanel.getHistoryItemCount();
    expect(postCount).toBe(1);
  });

  test('should search history by status code', async () => {
    // Make requests that will have different status codes
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Status Search Collection');
    await collectionsPanel.addRequestToCollection('Status Search Collection', 'Success Request');
    await collectionsPanel.addRequestToCollection('Status Search Collection', 'Not Found Request');

    // Success request
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // 404 request
    await collectionsPanel.selectRequest('Not Found Request');
    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/status/404');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Search by status
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    await historyPanel.searchHistory('200');
    let successCount = await historyPanel.getHistoryItemCount();
    expect(successCount).toBe(1);

    await historyPanel.searchHistory('404');
    let notFoundCount = await historyPanel.getHistoryItemCount();
    expect(notFoundCount).toBe(1);
  });

  test('should support partial and wildcard search', async () => {
    // Make request with complex URL
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Wildcard Search Collection');
    await collectionsPanel.addRequestToCollection('Wildcard Search Collection', 'Complex URL Request');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get?param1=value1&param2=value2');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Search with partial matches
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    await historyPanel.searchHistory('httpbin');
    let partialCount = await historyPanel.getHistoryItemCount();
    expect(partialCount).toBe(1);

    await historyPanel.searchHistory('param1');
    let paramCount = await historyPanel.getHistoryItemCount();
    expect(paramCount).toBe(1);

    await historyPanel.searchHistory('value');
    let valueCount = await historyPanel.getHistoryItemCount();
    expect(valueCount).toBe(1);
  });

  test('should load request from history when clicked', async () => {
    // Make a specific request
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Load From History Collection');
    await collectionsPanel.addRequestToCollection('Load From History Collection', 'History Load Test');

    await requestPanel.setMethod('PUT');
    await requestPanel.setUrl('https://httpbin.org/put');
    await requestPanel.addHeader('X-Custom-Header', 'test-value');
    await requestPanel.setBody('{"loaded": "from history"}', 'json');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Click on history item
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();
    await historyPanel.clickHistoryItem(0);

    // Should navigate back to collections/request panel
    await appLayout.navigateToCollections();

    // Verify request was loaded
    const currentMethod = await requestPanel.getMethod();
    const currentUrl = await requestPanel.getUrl();
    const headers = await requestPanel.getHeaders();

    expect(currentMethod).toBe('PUT');
    expect(currentUrl).toBe('https://httpbin.org/put');
    expect(headers.some(h => h.key === 'X-Custom-Header' && h.value === 'test-value')).toBe(true);
  });

  test('should clear history when clear button is clicked', async () => {
    // Make a request first
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Clear History Collection');
    await collectionsPanel.addRequestToCollection('Clear History Collection', 'Clear Test Request');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Verify history has items
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();
    expect(await historyPanel.isEmpty()).toBe(false);

    // Clear history
    await historyPanel.clearHistory();

    // Verify history is empty
    expect(await historyPanel.isEmpty()).toBe(true);
  });

  test('should handle search with no results', async () => {
    // Make a request first
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('No Results Search Collection');
    await collectionsPanel.addRequestToCollection('No Results Search Collection', 'Search Test Request');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Search for something that won't match
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();
    await historyPanel.searchHistory('nonexistent-term-12345');

    expect(await historyPanel.isEmpty()).toBe(true);
    const emptyText = await historyPanel.getEmptyStateText();
    expect(emptyText).toContain('No matching requests found');
  });

  test('should persist history across app sessions', async () => {
    // Make a request
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Persistence Test Collection');
    await collectionsPanel.addRequestToCollection('Persistence Test Collection', 'Persistence Test');

    await requestPanel.setMethod('DELETE');
    await requestPanel.setUrl('https://httpbin.org/delete');
    await requestPanel.sendRequest();
    await requestPanel.waitForResponse();

    // Simulate app restart
    await appLoaded.reload();
    await appLayout.waitForLoad();

    // Check history persists
    await appLayout.navigateToHistory();
    await historyPanel.waitForLoad();

    expect(await historyPanel.isEmpty()).toBe(false);
    const historyItem = await historyPanel.getHistoryItem(0);
    expect(historyItem.method).toBe('DELETE');
    expect(historyItem.url).toContain('httpbin.org/delete');
  });
});