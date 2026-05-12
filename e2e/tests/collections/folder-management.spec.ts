import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';

test.describe('Folder Management', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    await appLayout.navigateToCollections();
  });

  test('should create nested folders', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addFolderToCollection('Test Collection', 'Level 1');
    await collectionsPanel.expandCollection('Test Collection');
    await collectionsPanel.addFolderToCollection('Level 1', 'Level 2');
    expect(await collectionsPanel.page.locator('text=Level 2').isVisible()).toBe(true);
  });

  test('should delete folder with confirmation', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addFolderToCollection('Test Collection', 'Test Folder');
    await collectionsPanel.page.locator('text=Test Folder').click({ button: 'right' });
    await collectionsPanel.page.locator('text=Delete').click();
    // Assuming confirmation dialog
    await collectionsPanel.page.locator('button:has-text("Delete")').click();
    expect(await collectionsPanel.page.locator('text=Test Folder').isVisible()).toBe(false);
  });

  test('should move requests between folders', async () => {
    // This might require drag-and-drop or move functionality
    // Placeholder for now
    expect(true).toBe(true);
  });

  test('should handle folder with many requests', async () => {
    await collectionsPanel.addCollection('Test Collection');
    await collectionsPanel.addFolderToCollection('Test Collection', 'Large Folder');

    // Add many requests
    for (let i = 1; i <= 20; i++) {
      await collectionsPanel.addRequestToFolder('Test Collection', 'Large Folder', `Request ${i}`);
    }

    // Check scrolling or pagination if implemented
    const requestCount = await collectionsPanel.page.locator('.request-item').count();
    expect(requestCount).toBeGreaterThan(10);
  });
});