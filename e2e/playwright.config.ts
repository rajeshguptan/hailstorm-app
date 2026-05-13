import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000, // Increased for load testing
  expect: {
    timeout: 10000, // Increased for async operations
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'unit-tests',
      testMatch: '*.spec.ts',
      grepInvert: /load-testing|runner/,
    },
    {
      name: 'load-testing',
      testMatch: '**/load-testing.spec.ts',
      timeout: 120000, // Longer timeout for load tests
    },
    {
      name: 'runner-tests',
      testMatch: '**/runner.spec.ts',
      timeout: 90000, // Longer timeout for runner tests
    },
    {
      name: 'integration-tests',
      testMatch: ['**/history/**', '**/settings/**', '**/storage/**'],
    },
    {
      name: 'collection-tests',
      testMatch: '**/collections/**',
    },
    {
      name: 'request-tests',
      testMatch: '**/requests/**',
    },
  ],
  outputDir: 'test-results/',
  globalSetup: undefined,
  globalTeardown: undefined,
});
