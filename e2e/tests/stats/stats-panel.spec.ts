import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';

test.describe('Stats Panel', () => {
  let appLayout: AppLayout;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    await appLayout.navigateToStats();
  });

  test('should display stats panel', async () => {
    await expect(appLayout.page.locator('.stats-panel')).toBeVisible();
    await expect(appLayout.page.locator('text=No load test data available')).toBeVisible();
  });

  test('should display stats header with run selector and action buttons', async () => {
    const header = appLayout.page.locator('.stats-header');
    await expect(header).toBeVisible();
    await expect(header.locator('select')).toBeVisible();
    await expect(header.getByRole('button', { name: 'Print' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Export JSON' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Delete all' })).toBeVisible();
  });

  test('should not display chart in header section', async () => {
    const header = appLayout.page.locator('.stats-header');
    await expect(header.locator('.chart-container')).toHaveCount(0);
  });

  test('should not render charts when no load tests exist', async () => {
    const content = appLayout.page.locator('.stats-content');
    await expect(content.locator('.chart-container')).toHaveCount(0);
  });

  test('should show no data state when no load tests exist', async () => {
    await expect(appLayout.page.locator('text=No load test data available')).toBeVisible();
  });

  test('should display stacked bar chart for HTTP status codes when data exists', async () => {
    // Select a completed run to load historical data
    const select = appLayout.page.locator('.stats-header select');
    await select.selectOption({ index: 1 });

    // Wait for charts to load
    await appLayout.page.waitForSelector('.chart-container', { timeout: 5000 });

    // Should have chart containers for all three charts
    const chartContainers = appLayout.page.locator('.chart-container');
    await expect(chartContainers).toHaveCount(3);
  });
});
