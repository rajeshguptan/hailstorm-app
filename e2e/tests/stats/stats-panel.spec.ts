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
    await expect(appLayout.page.locator('h3:has-text("Load Test Stats")')).toBeVisible();
  });

  test('should display stats header with print and export buttons', async () => {
    const header = appLayout.page.locator('.stats-header');
    await expect(header).toBeVisible();
    await expect(header.locator('button:has-text("Print")')).toBeVisible();
    await expect(header.locator('button:has-text("Export JSON")')).toBeVisible();
  });

  test('should not display chart in header section', async () => {
    // Verify that the header section does not contain a chart container
    const header = appLayout.page.locator('.stats-header');
    const chartContainerInHeader = header.locator('.chart-container');
    await expect(chartContainerInHeader).toHaveCount(0);
  });

  test('should display charts in main content area', async () => {
    const content = appLayout.page.locator('.stats-content');
    const chartContainers = content.locator('.chart-container');
    await expect(chartContainers).toHaveCount(3); // Requests, Errors, and Response Time charts
  });

  test('should display response time chart in main content', async () => {
    const responseTimeChart = appLayout.page.locator('.chart-container').filter({ hasText: 'Median Response Time Over Time' });
    await expect(responseTimeChart).toBeVisible();
  });

  test('should display run selector with label inline', async () => {
    const runSelector = appLayout.page.locator('select');
    await expect(runSelector).toBeVisible();
    const label = appLayout.page.locator('label:has-text("Select Run")');
    await expect(label).toBeVisible();
    // Verify label is not a block element (should be inline)
    await expect(label).not.toHaveClass(/block/);
  });

  test('should show no data state when no load tests exist', async () => {
    const noDataMessage = appLayout.page.locator('text=No load test data available');
    await expect(noDataMessage).toBeVisible();
  });
});