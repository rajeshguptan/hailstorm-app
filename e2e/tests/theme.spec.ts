import { test, expect } from './fixtures/base.fixture';
import { AppLayout } from './fixtures/page-objects/AppLayout';

test.describe('Theme Tests', () => {
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

  test('should show unlocked secrets icon when encryption key exists', async () => {
    // Set an encryption key
    await appLoaded.evaluate(() => {
      localStorage.setItem('hailstorm_encryption_key', 'test-key-123');
    });

    // Reload to reset state
    await appLoaded.reload();
    await appLayout.waitForLoad();

    // Check that secrets icon shows unlocked symbol
    const secretsButton = appLoaded.locator('.ribbon-bar button:has-text("Secrets")');
    const iconSpan = secretsButton.locator('span').first();
    const iconText = await iconSpan.textContent();
    expect(iconText).toBe('🔓');
  });

  test('should show unlock modal when clicking locked secrets icon', async () => {
    // Clear any existing encryption key
    await appLoaded.evaluate(() => {
      localStorage.removeItem('hailstorm_encryption_key');
    });

    // Reload to reset state
    await appLoaded.reload();
    await appLayout.waitForLoad();

    // Click the locked secrets icon
    const secretsButton = appLoaded.locator('.ribbon-bar button:has-text("Secrets")');
    await secretsButton.click();

    // Check that unlock modal appears
    const modal = appLoaded.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();

    // Check modal title
    const modalTitle = appLoaded.locator('h3:has-text("Set Encryption Key")');
    await expect(modalTitle).toBeVisible();
  });
});
