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
                // Handle invalid URLs
                if (/^GET |^POST |^PUT |^DELETE |^PATCH |^HEAD /i.test(url)) {
                  resolve({
                    status: 0,
                    statusText: 'Error',
                    headers: {},
                    data: '',
                    time: 0,
                    error: 'Invalid URL: method should be selected from dropdown, not typed in URL field'
                  });
                  return;
                }
                // Handle unsupported protocols
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  resolve({
                    status: 0,
                    statusText: 'Error',
                    headers: {},
                    data: '',
                    time: 0,
                    error: 'Unsupported protocol: Only http and https are supported.'
                  });
                  return;
                }
                // Simulate different responses based on URL
                if (url.includes('status/404')) {
                  resolve({ status: 404, statusText: 'Not Found', headers: {}, data: '{"error": "Not Found"}', time: 150 });
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

          selectWorkspace: () => {
            console.log('[MOCK API] selectWorkspace');
            return Promise.resolve('/home/testuser/hailstorm');
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
            return Promise.resolve((window.__mockLoadTest && window.__mockLoadTest.stats) || {
              runId: runId,
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

          getLoadTestTimeSeriesData: (runId, startTime, endTime) => {
            console.log('[MOCK API] getLoadTestTimeSeriesData:', runId, startTime, endTime);
            return Promise.resolve([
              { timestamp: Date.now() - 60000, requests: 5, errors: 0, avgResponseTime: 120, p50ResponseTime: 100, p75ResponseTime: 110, p90ResponseTime: 120, p95ResponseTime: 130, p99ResponseTime: 150 },
              { timestamp: Date.now() - 30000, requests: 3, errors: 1, avgResponseTime: 180, p50ResponseTime: 150, p75ResponseTime: 170, p90ResponseTime: 180, p95ResponseTime: 190, p99ResponseTime: 200 },
              { timestamp: Date.now(), requests: 2, errors: 0, avgResponseTime: 90, p50ResponseTime: 80, p75ResponseTime: 85, p90ResponseTime: 90, p95ResponseTime: 95, p99ResponseTime: 100 }
            ]);
          },

          getLoadTestTimeSeriesDataByRequest: (runId, startTime, endTime) => {
            console.log('[MOCK API] getLoadTestTimeSeriesDataByRequest:', runId, startTime, endTime);
            return Promise.resolve([
              { requestName: 'GET Request', timestamp: Date.now() - 60000, requests: 5, errors: 0, avgResponseTime: 120, p50ResponseTime: 100, p75ResponseTime: 110, p90ResponseTime: 120, p95ResponseTime: 130, p99ResponseTime: 150 },
              { requestName: 'POST Request', timestamp: Date.now() - 60000, requests: 3, errors: 0, avgResponseTime: 90, p50ResponseTime: 80, p75ResponseTime: 85, p90ResponseTime: 90, p95ResponseTime: 95, p99ResponseTime: 90 },
              { requestName: 'GET Request', timestamp: Date.now() - 30000, requests: 4, errors: 1, avgResponseTime: 180, p50ResponseTime: 150, p75ResponseTime: 170, p90ResponseTime: 180, p95ResponseTime: 190, p99ResponseTime: 200 },
              { requestName: 'POST Request', timestamp: Date.now() - 30000, requests: 2, errors: 0, avgResponseTime: 85, p50ResponseTime: 80, p75ResponseTime: 82, p90ResponseTime: 85, p95ResponseTime: 88, p99ResponseTime: 90 }
            ]);
          },

          getLoadTestTimeSeriesDataByStatus: (runId, startTime, endTime) => {
            console.log('[MOCK API] getLoadTestTimeSeriesDataByStatus:', runId, startTime, endTime);
            return Promise.resolve([
              { statusCode: 200, timestamp: Date.now() - 60000, requests: 5, avgResponseTime: 120, p50ResponseTime: 100, p75ResponseTime: 110, p90ResponseTime: 120, p95ResponseTime: 130, p99ResponseTime: 150 },
              { statusCode: 200, timestamp: Date.now() - 30000, requests: 4, avgResponseTime: 180, p50ResponseTime: 150, p75ResponseTime: 170, p90ResponseTime: 180, p95ResponseTime: 190, p99ResponseTime: 200 },
              { statusCode: 500, timestamp: Date.now() - 30000, requests: 1, avgResponseTime: 250, p50ResponseTime: 250, p75ResponseTime: 250, p90ResponseTime: 250, p95ResponseTime: 250, p99ResponseTime: 250 },
              { statusCode: 200, timestamp: Date.now(), requests: 2, avgResponseTime: 90, p50ResponseTime: 80, p75ResponseTime: 85, p90ResponseTime: 90, p95ResponseTime: 95, p99ResponseTime: 100 },
              { statusCode: 404, timestamp: Date.now(), requests: 1, avgResponseTime: 50, p50ResponseTime: 50, p75ResponseTime: 50, p90ResponseTime: 50, p95ResponseTime: 50, p99ResponseTime: 50 },
              { statusCode: 201, timestamp: Date.now(), requests: 1, avgResponseTime: 100, p50ResponseTime: 100, p75ResponseTime: 100, p90ResponseTime: 100, p95ResponseTime: 100, p99ResponseTime: 100 }
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

          runLoadTest: async (params) => {
            console.log('[MOCK API] runLoadTest:', params);
            var callbacks = (window.__mockLoadTest && window.__mockLoadTest.callbacks) || [];
            var runId = params.runId || 'mock-run-' + Date.now();
            var stats = {
              runId: runId,
              totalRequests: 0,
              successfulRequests: 0,
              failedRequests: 0,
              errorRate: 0,
              avgResponseTime: 0,
              minResponseTime: 0,
              maxResponseTime: 0,
              requestsPerSecond: 0,
              lastLatency: 0,
              lastStatus: 0,
              lastRequestName: ''
            };
            window.__mockLoadTest = {
              callbacks: callbacks,
              runId: runId,
              running: true,
              completed: false,
              stats: stats,
              release: function() {
                window.__mockLoadTest.running = false;
              },
              emitStats: function(nextStats) {
                window.__mockLoadTest.stats = nextStats;
                callbacks.forEach(function(callback) { callback({ runId: runId, stats: nextStats }); });
              }
            };

            for (var i = 1; i <= 3 && window.__mockLoadTest.running; i++) {
              await new Promise(function(resolve) { setTimeout(resolve, 50); });
              var nextStats = {
                runId: runId,
                totalRequests: i,
                successfulRequests: i,
                failedRequests: 0,
                errorRate: 0,
                avgResponseTime: 100 + i,
                minResponseTime: 90 + i,
                maxResponseTime: 110 + i,
                requestsPerSecond: i,
                lastLatency: 100 + i,
                lastStatus: 200,
                lastRequestName: 'GET Request'
              };
              window.__mockLoadTest.emitStats(nextStats);
            }

            window.__mockLoadTest.completed = true;
            window.__mockLoadTest.running = false;
            return { run: { id: runId, status: 'completed' }, results: [] };
          },

          stopLoadTest: async () => {
            console.log('[MOCK API] stopLoadTest');
            if (window.__mockLoadTest) {
              window.__mockLoadTest.release();
            }
            return Promise.resolve();
          },

          onLoadTestStatsUpdate: (callback) => {
            if (!window.__mockLoadTest) {
              window.__mockLoadTest = { callbacks: [], running: false, completed: false };
            }
            window.__mockLoadTest.callbacks.push(callback);
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
          },

          // Logging APIs
          getLogLevel: () => {
            console.log('[MOCK API] getLogLevel');
            return Promise.resolve('info');
          },

          setLogLevel: (level) => {
            console.log('[MOCK API] setLogLevel:', level);
            return Promise.resolve();
          },

getHomeDirectory: () => {
             console.log('[MOCK API] getHomeDirectory');
             return Promise.resolve('/home/testuser');
           },

           getCurrentCollection: () => {
             console.log('[MOCK API] getCurrentCollection');
             return null;
           },

           saveCollectionToFiles: (collection, workspacePath, environments, runConfigs) => {
             console.log('[MOCK API] saveCollectionToFiles:', collection.name, workspacePath);
             // This is a mock - actual file saving happens in the main process
             return Promise.resolve(true);
           },

           saveRunStatsToWorkspace: (workspacePath, runStats) => {
             console.log('[MOCK API] saveRunStatsToWorkspace:', workspacePath);
             // This is a mock - actual file saving happens in the main process
             return Promise.resolve({ success: true });
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