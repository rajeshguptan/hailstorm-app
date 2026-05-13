import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Base fixture that ensures the app is loaded
  appLoaded: async ({ page }, use) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Set up page before navigation
    await page.goto('http://localhost:5173/');

    // Enhanced Electron API mocking for comprehensive testing
    await page.addScriptTag({
      content: `
        window.api = {
          // HTTP Request functionality
          makeRequest: ({ method, url, headers, body, rps, requestId }) => {
            console.log('[MOCK API] makeRequest:', { method, url, headers, body, rps, requestId });
            return new Promise((resolve) => {
              setTimeout(() => {
                // Simulate different responses based on URL
                if (url.includes('status/404')) {
                  resolve({ status: 404, statusText: 'Not Found', headers: {}, data: '{"error": "Not Found"}', time: 150 });
                } else if (url.includes('delay/')) {
                  const delay = parseInt(url.split('delay/')[1]) || 1;
                  resolve({ status: 200, statusText: 'OK', headers: {}, data: '{"delayed": true}', time: delay * 1000 });
                } else if (url.includes('bearer') && (!headers || !headers.Authorization || !headers.Authorization.includes('Bearer'))) {
                  resolve({ status: 401, statusText: 'Unauthorized', headers: {}, data: '{"error": "Unauthorized"}', time: 100 });
                } else {
                  resolve({
                    status: 200,
                    statusText: 'OK',
                    headers: { 'content-type': 'application/json' },
                    data: JSON.stringify({
                      method,
                      url,
                      headers,
                      body: body ? JSON.parse(body) : null,
                      timestamp: Date.now()
                    }),
                    time: Math.random() * 200 + 50
                  });
                }
              }, Math.random() * 100 + 50); // Random delay 50-150ms
            });
          },

          // Shell command execution
          runShell: (command) => {
            console.log('[MOCK API] runShell:', command);
            return Promise.resolve({ output: 'Mock shell output', error: '' });
          },

          // File operations
          importCollection: () => {
            console.log('[MOCK API] importCollection');
            return Promise.resolve(JSON.stringify({
              id: 'imported-collection',
              name: 'Imported Collection',
              items: [{
                id: 'imported-request',
                name: 'Imported Request',
                method: 'GET',
                url: 'https://httpbin.org/get'
              }]
            }));
          },

          importEnvironment: () => {
            console.log('[MOCK API] importEnvironment');
            return Promise.resolve(JSON.stringify({
              id: 'imported-env',
              name: 'Imported Environment',
              variables: [{ key: 'BASE_URL', value: 'https://api.example.com', enabled: true }]
            }));
          },

          // Load testing APIs
          initializeLoadTesting: () => {
            console.log('[MOCK API] initializeLoadTesting');
            return Promise.resolve();
          },

          startLoadTestRun: (runConfig) => {
            console.log('[MOCK API] startLoadTestRun:', runConfig);
            return Promise.resolve({
              id: 'mock-run-' + Date.now(),
              ...runConfig,
              startTime: Date.now(),
              status: 'running'
            });
          },

          recordLoadTestRequest: (runId, requestData) => {
            console.log('[MOCK API] recordLoadTestRequest:', runId, requestData);
            return Promise.resolve();
          },

          endLoadTestRun: (runId) => {
            console.log('[MOCK API] endLoadTestRun:', runId);
            return Promise.resolve({
              id: runId,
              endTime: Date.now(),
              status: 'completed'
            });
          },

          getLoadTestRunStats: (runId) => {
            console.log('[MOCK API] getLoadTestRunStats:', runId);
            return Promise.resolve({
              runId,
              totalRequests: 10,
              successfulRequests: 9,
              failedRequests: 1,
              errorRate: 10,
              avgResponseTime: 150,
              minResponseTime: 50,
              maxResponseTime: 300,
              requestsPerSecond: 6.67
            });
          },

          getLoadTestTimeSeriesData: (runId) => {
            console.log('[MOCK API] getLoadTestTimeSeriesData:', runId);
            return Promise.resolve([
              { timestamp: Date.now() - 60000, requests: 5, errors: 0, avgResponseTime: 120 },
              { timestamp: Date.now() - 30000, requests: 3, errors: 1, avgResponseTime: 180 },
              { timestamp: Date.now(), requests: 2, errors: 0, avgResponseTime: 90 }
            ]);
          },

          exportLoadTestRunData: (runId, format) => {
            console.log('[MOCK API] exportLoadTestRunData:', runId, format);
            if (format === 'json') {
              return Promise.resolve(JSON.stringify({
                runId,
                stats: { totalRequests: 10, successfulRequests: 9 },
                timeSeries: []
              }));
            } else {
              return Promise.resolve('timestamp,requests,errors,avgResponseTime\n' +
                '1703123456789,5,0,120\n' +
                '1703123516789,3,1,180\n');
            }
          },

          getCompletedLoadTestRuns: () => {
            console.log('[MOCK API] getCompletedLoadTestRuns');
            return Promise.resolve([{
              id: 'completed-run-1',
              name: 'Test Run',
              startTime: Date.now() - 300000,
              endTime: Date.now() - 60000,
              status: 'completed'
            }]);
          },

          deleteLoadTestRun: (runId) => {
            console.log('[MOCK API] deleteLoadTestRun:', runId);
            return Promise.resolve();
          },

          // File dialog mocks
          showOpenDialog: (options) => {
            console.log('[MOCK API] showOpenDialog:', options);
            return Promise.resolve({
              canceled: false,
              filePaths: ['/mock/path/test.json']
            });
          },

          // Secrets APIs
          exportSecretsDialog: (secretsData) => {
            console.log('[MOCK API] exportSecretsDialog');
            return Promise.resolve('/mock/path/secrets.json');
          },

          importSecretsDialog: () => {
            console.log('[MOCK API] importSecretsDialog');
            return Promise.resolve({
              filePath: '/mock/path/secrets.json',
              content: JSON.stringify({ secrets: [] })
            });
          },

          selectDatafileDialog: (filters) => {
            console.log('[MOCK API] selectDatafileDialog:', filters);
            return Promise.resolve({
              canceled: false,
              filePaths: ['/mock/path/data.csv']
            });
          }
        };

        // Mock Electron dialog
        window.electron = {
          dialog: {
            showOpenDialog: window.api.showOpenDialog,
            showSaveDialog: (options) => {
              console.log('[MOCK DIALOG] showSaveDialog:', options);
              return Promise.resolve({
                canceled: false,
                filePath: '/mock/path/save.json'
              });
            }
          }
        };
      `
    });

    // Wait for the ribbon bar to be visible (indicates app is loaded)
    await page.waitForSelector('.ribbon-bar', { timeout: 15000 });

    // Additional setup for better test reliability
    await page.waitForLoadState('networkidle');

    await use(page);
  },
});

// Export types for better TypeScript support
export { expect };