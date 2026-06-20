import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';

test.describe('Docs Panel', () => {
  let appLayout: AppLayout;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
  });

  test('should display docs ribbon item and docs panel', async () => {
    await expect(appLayout.docsNav).toBeVisible();
    await appLayout.navigateToDocs();
    await expect(appLayout.page.locator('[data-testid="docs-panel"]')).toBeVisible();
    await expect(appLayout.page.locator('text=Hailstorm Docs')).toBeVisible();
  });

  test('should display documentation sections', async () => {
    await appLayout.navigateToDocs();
    const docsSidebar = appLayout.page.locator('[data-testid="docs-panel"] .docs-sidebar');
    await expect(docsSidebar.getByRole('button', { name: 'Getting Started' })).toBeVisible();
    await expect(docsSidebar.getByRole('button', { name: 'Request Types' })).toBeVisible();
    await expect(docsSidebar.getByRole('button', { name: 'Runner and Load Testing' })).toBeVisible();
    await expect(docsSidebar.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('should search documentation content', async () => {
    await appLayout.navigateToDocs();
    await appLayout.page.locator('#docs-search').fill('OAuth 2.0');
    await expect(appLayout.page.getByRole('heading', { name: 'OAuth 2.0' })).toBeVisible();
  });
});
