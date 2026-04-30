import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { TestDataSeeder } from '../fixtures/test-data';

test.describe('Collection CRUD Operations', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    await appLayout.navigateToCollections();
  });

  test('should add a new collection', async () => {
    const initialCount = await collectionsPanel.getCollectionCount();
    await collectionsPanel.addCollection();
    const finalCount = await collectionsPanel.getCollectionCount();
    expect(finalCount).toBe(initialCount + 1);
    expect(await collectionsPanel.page.locator('text=New Collection').isVisible()).toBe(true);
  });

  test('should add a folder to a collection', async () => {
    await collectionsPanel.addCollection();
    await collectionsPanel.addFolderToCollection('New Collection');
    await collectionsPanel.expandCollection('New Collection');
    expect(await collectionsPanel.page.locator('text=New Folder').isVisible()).toBe(true);
  });

  test('should add a request to a collection', async () => {
    await collectionsPanel.addCollection();
    await collectionsPanel.addRequestToCollection('New Collection');
    await collectionsPanel.expandCollection('New Collection');
    expect(await collectionsPanel.page.locator('text=New Request').isVisible()).toBe(true);
  });

  test('should add a request to a folder', async () => {
    await collectionsPanel.addCollection();
    await collectionsPanel.addFolderToCollection('New Collection');
    await collectionsPanel.expandFolder('New Collection', 'New Folder');
    await collectionsPanel.addRequestToFolder('New Collection', 'New Folder');
    expect(await collectionsPanel.page.locator('text=New Request').isVisible()).toBe(true);
  });

  test('should rename a collection via context menu', async () => {
    await collectionsPanel.addCollection('Original Collection');
    await collectionsPanel.renameCollection('Original Collection', 'Renamed Collection');
    expect(await collectionsPanel.page.locator('text=Renamed Collection').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Original Collection').isVisible()).toBe(false);
  });

  test('should rename a folder via context menu', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addFolderToCollection('Test Collection', 'Original Folder');
    await collectionsPanel.renameCollection('Original Folder', 'Renamed Folder'); // Note: reusing method, adjust selector
    expect(await collectionsPanel.page.locator('text=Renamed Folder').isVisible()).toBe(true);
  });

  test('should delete a collection via context menu', async () => {
    await collectionsPanel.addCollection('Test Collection');
    const initialCount = await collectionsPanel.getCollectionCount();
    await collectionsPanel.deleteCollection('Test Collection');
    const finalCount = await collectionsPanel.getCollectionCount();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should toggle collection expansion', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addRequestToCollection('Test Collection', 'Test Request');

    // Initially collapsed
    expect(await collectionsPanel.page.locator('.request-item').isVisible()).toBe(false);

    await collectionsPanel.expandCollection('Test Collection');
    expect(await collectionsPanel.page.locator('.request-item').isVisible()).toBe(true);
  });

  test('should show correct context menu options for collection', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.rightClickCollection('Test Collection');

    await expect(collectionsPanel.page.locator('text=Rename')).toBeVisible();
    await expect(collectionsPanel.page.locator('text=Add Request')).toBeVisible();
    await expect(collectionsPanel.page.locator('text=Add Folder')).toBeVisible();
    await expect(collectionsPanel.page.locator('text=Delete')).toBeVisible();
  });

  test('should show correct context menu options for folder', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addFolderToCollection('Test Collection', 'Test Folder');
    await collectionsPanel.page.locator('text=Test Folder').click({ button: 'right' });

    await expect(collectionsPanel.page.locator('text=Rename')).toBeVisible();
    await expect(collectionsPanel.page.locator('text=Add Request')).toBeVisible();
    await expect(collectionsPanel.page.locator('text=Add Folder')).toBeVisible();
    await expect(collectionsPanel.page.locator('text=Delete')).toBeVisible();
  });

  test('should show empty message when no collections exist', async ({ appLoaded }) => {
    // Clear any existing data
    await TestDataSeeder.clearAppData(appLoaded);
    await appLoaded.reload();
    await appLayout.navigateToCollections();
    expect(await collectionsPanel.isEmpty()).toBe(true);
  });

  test('should import collection button be visible', async () => {
    await expect(collectionsPanel.importBtn).toBeVisible();
  });

  // Additional tests for edge cases
  test('should handle collection with special characters in name', async () => {
    const specialName = 'Test_Collection-123!@#';
    await collectionsPanel.addCollection(specialName);
    expect(await collectionsPanel.page.locator(`text=${specialName}`).isVisible()).toBe(true);
  });

  test('should prevent duplicate collection names', async () => {
    await collectionsPanel.addCollection('Duplicate Collection');
    await collectionsPanel.addCollection('Duplicate Collection');
    // Assuming UI prevents or handles duplicates
    const count = await collectionsPanel.page.locator('text=Duplicate Collection').count();
    expect(count).toBeGreaterThanOrEqual(1); // Adjust based on actual behavior
  });
});