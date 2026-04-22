import { test as base } from '@playwright/test';

export const test = base.extend({
  // Base fixture that ensures the app is loaded
  appLoaded: async ({ page }, use) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('/');
    // Wait for the main layout to be visible
    await page.waitForSelector('.hailstorm-app', { timeout: 15000 });
    await use(page);
  },
});

// Export types for better TypeScript support
export { expect } from '@playwright/test';