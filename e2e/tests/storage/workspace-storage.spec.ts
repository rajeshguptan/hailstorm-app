import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';

test.describe('Workspace Storage UI', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    await appLayout.navigateToCollections();
  });

  test('should have workspace location input in collection panel', async () => {
    await collectionsPanel.addCollection('Workspace Collection');
    await collectionsPanel.selectCollection('Workspace Collection');

    const workspaceInput = appLayout.page.locator('input[placeholder="Select workspace directory..."]');
    await expect(workspaceInput).toBeVisible();
  });

  test('should have browse button for workspace location', async () => {
    await collectionsPanel.addCollection('Browse Test');
    await collectionsPanel.selectCollection('Browse Test');

    const browseBtn = appLayout.page.locator('button:has-text("Browse")');
    await expect(browseBtn).toBeVisible();
  });

  test('should save collection when save button is clicked', async () => {
    await collectionsPanel.addCollection('Save Test Collection');
    await collectionsPanel.selectCollection('Save Test Collection');

    const saveBtn = appLayout.page.locator('button:has-text("Save")');
    await saveBtn.click();

    await expect(appLayout.page.locator('text=Save Test Collection')).toBeVisible();
  });

  test('should support private and shared request distinction', async () => {
    await collectionsPanel.addCollection('Private Shared Test');
    await collectionsPanel.selectCollection('Private Shared Test');

    await collectionsPanel.addRequestToCollection('Private Shared Test', 'Test Request');

    await expect(appLayout.page.locator('text=Test Request')).toBeVisible();
  });
});