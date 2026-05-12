import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';

test.describe('Secrets Icon Tests', () => {
  let appLayout: AppLayout;
  let appLoaded: any;

  test.beforeEach(async ({ appLoaded: loadedPage }) => {
    appLoaded = loadedPage;
    appLayout = new AppLayout(appLoaded);
    await appLayout.waitForLoad();
  });

  test('should show locked secrets icon when no encryption key exists', async () => {
    // Clear any existing encryption key
    await appLoaded.evaluate(() => {
      localStorage.removeItem('hailstorm_encryption_key');
    });

    // Reload to reset state
    await appLoaded.reload();
    await appLayout.waitForLoad();

    // Check that secrets icon shows locked symbol
    const secretsButton = appLoaded.locator('.ribbon-bar button:has-text("Secrets")');
    const iconSpan = secretsButton.locator('span').first();
    const iconText = await iconSpan.textContent();
    expect(iconText).toBe('🔒');
  });

  test('should always show locked secrets icon on app start', async () => {
    // Even if encryption key exists, app should start locked
    await appLoaded.evaluate(() => {
      localStorage.setItem('hailstorm_encryption_key', 'test-key-123');
    });

    // Reload to reset state
    await appLoaded.reload();
    await appLayout.waitForLoad();

    // Check that secrets icon shows locked symbol
    const secretsButton = appLoaded.locator('.ribbon-bar button:has-text("Secrets")');
    const iconSpan = secretsButton.locator('span').first();
    const iconText = await iconSpan.textContent();
    expect(iconText).toBe('🔒');
  });
});
