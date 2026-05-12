import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Base fixture that ensures the app is loaded
  appLoaded: async ({ page }, use) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('http://localhost:5173/');
    // Mock the Electron API since tests run in browser context
    await page.addScriptTag({
      content: `
        window.api = {
          makeRequest: () => Promise.resolve({ status: 200, statusText: 'OK', headers: {}, data: '{}', time: 100 }),
          runShell: () => Promise.resolve({ output: '', error: '' }),
          importCollection: () => Promise.resolve(null),
          importEnvironment: () => Promise.resolve(null)
        };
      `
    });
    // Wait for the ribbon bar to be visible (indicates app is loaded)
    await page.waitForSelector('.ribbon-bar', { timeout: 15000 });
    await use(page);
  },
});

// Export types for better TypeScript support
export { expect };