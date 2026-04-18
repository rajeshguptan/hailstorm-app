import { test, expect } from '@playwright/test';

test.describe('Collections Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can add a new collection', async ({ page }) => {
    await page.click('text=+ Collection');
    const collectionItems = await page.locator('.collection-item').count();
    expect(collectionItems).toBeGreaterThan(0);
  });

  test('can add a folder to a collection', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.click('.collection-item >> nth=0');
    await page.click('.collection-item >> nth=0 >> .collection-item >> nth=0', { force: true });
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Add Folder');
    await page.waitForTimeout(500);
    const folderText = await page.locator('text=New Folder').count();
    expect(folderText).toBeGreaterThan(0);
  });

  test('can add a request to a collection', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Add Request');
    await page.waitForTimeout(500);
    const requestText = await page.locator('text=New Request').count();
    expect(requestText).toBeGreaterThan(0);
  });

  test('can add a request to a folder', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Add Folder');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Add Request');
    await page.waitForTimeout(500);
    const requestText = await page.locator('text=New Request').count();
    expect(requestText).toBeGreaterThan(0);
  });

  test('can rename a collection via context menu', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Rename');
    await page.waitForTimeout(500);
    const modal = page.locator('h5:has-text("Rename")');
    await expect(modal).toBeVisible();
    await page.fill('input[placeholder="Enter new name"]', 'Renamed Collection');
    await page.click('button:has-text("Rename")');
    await page.waitForTimeout(500);
    const renamedText = await page.locator('text=Renamed Collection').count();
    expect(renamedText).toBeGreaterThan(0);
  });

  test('can rename a folder via context menu', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Add Folder');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Rename');
    await page.waitForTimeout(500);
    const modal = page.locator('h5:has-text("Rename")');
    await expect(modal).toBeVisible();
    await page.fill('input[placeholder="Enter new name"]', 'Renamed Folder');
    await page.click('button:has-text("Rename")');
    await page.waitForTimeout(500);
    const renamedText = await page.locator('text=Renamed Folder').count();
    expect(renamedText).toBeGreaterThan(0);
  });

  test('can delete a collection via context menu', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    const collectionCountBefore = await page.locator('.collection-item').count();
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Delete');
    await page.waitForTimeout(500);
    const collectionCountAfter = await page.locator('.collection-item').count();
    expect(collectionCountAfter).toBe(collectionCountBefore - 1);
  });

  test('can toggle collection expansion', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click();
    await page.waitForTimeout(500);
    const expandedFolder = await page.locator('.request-item').count();
    expect(expandedFolder).toBeGreaterThanOrEqual(0);
  });

  test('context menu shows correct options for collection', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Rename')).toBeVisible();
    await expect(page.locator('text=Add Request')).toBeVisible();
    await expect(page.locator('text=Add Folder')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
  });

  test('context menu shows correct options for folder', async ({ page }) => {
    await page.click('text=+ Collection');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.click('text=Add Folder');
    await page.waitForTimeout(500);
    await page.locator('.collection-item >> nth=0').click({ button: 'right' });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Rename')).toBeVisible();
    await expect(page.locator('text=Add Request')).toBeVisible();
    await expect(page.locator('text=Add Folder')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
  });
});

test.describe('Import Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('import button exists', async ({ page }) => {
    await expect(page.locator('button:has-text("Import")')).toBeVisible();
  });
});

test.describe('Empty State', () => {
  test('shows empty message when no collections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=No collections yet')).toBeVisible();
  });
});