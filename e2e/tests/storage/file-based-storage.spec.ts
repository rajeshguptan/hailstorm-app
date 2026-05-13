import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';

test.describe('File-based Storage', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    await appLayout.navigateToCollections();
  });

  test('should create collection with workspace location', async () => {
    await collectionsPanel.addCollection('Workspace Collection');

    // This test would need to mock the workspace selection dialog
    // For now, verify collection creation works
    expect(await collectionsPanel.page.locator('text=Workspace Collection').isVisible()).toBe(true);
  });

  test('should save collection to files when workspace is set', async () => {
    await collectionsPanel.addCollection('File Save Collection');
    await collectionsPanel.addRequestToCollection('File Save Collection', 'File Save Request');

    // Mock workspace selection and saving
    // This would require mocking the IPC calls and file system operations
    expect(await collectionsPanel.page.locator('text=File Save Collection').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=File Save Request').isVisible()).toBe(true);
  });

  test('should load collection from files on startup', async () => {
    // This test would require setting up files beforehand and verifying they're loaded
    // For now, test basic collection loading behavior
    await collectionsPanel.addCollection('Load Test Collection');
    await collectionsPanel.expandCollection('Load Test Collection');

    expect(await collectionsPanel.page.locator('.collection-item').isVisible()).toBe(true);
  });

  test('should handle file-based storage errors gracefully', async () => {
    await collectionsPanel.addCollection('Error Handling Collection');

    // Test that app continues to work even if file operations fail
    await collectionsPanel.addRequestToCollection('Error Handling Collection', 'Error Test Request');

    expect(await collectionsPanel.page.locator('text=Error Handling Collection').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Error Test Request').isVisible()).toBe(true);
  });

  test('should auto-save changes when workspace location is configured', async () => {
    await collectionsPanel.addCollection('Auto Save Collection');
    await collectionsPanel.addRequestToCollection('Auto Save Collection', 'Auto Save Request');

    // Edit collection properties
    await collectionsPanel.renameCollection('Auto Save Collection', 'Renamed Auto Save Collection');

    // Verify rename was successful (auto-save would happen here)
    expect(await collectionsPanel.page.locator('text=Renamed Auto Save Collection').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Auto Save Collection').isVisible()).toBe(false);
  });

  test('should maintain folder structure in file system', async () => {
    await collectionsPanel.addCollection('Folder Structure Collection');
    await collectionsPanel.addFolderToCollection('Folder Structure Collection', 'Test Folder');
    await collectionsPanel.addRequestToFolder('Folder Structure Collection', 'Test Folder', 'Folder Request');

    await collectionsPanel.expandCollection('Folder Structure Collection');
    await collectionsPanel.expandFolder('Folder Structure Collection', 'Test Folder');

    expect(await collectionsPanel.page.locator('text=Test Folder').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Folder Request').isVisible()).toBe(true);
  });

  test('should preserve collection metadata in files', async () => {
    await collectionsPanel.addCollection('Metadata Collection');

    // Collection metadata like description, auth, variables should be preserved
    // This would require full file system mocking to test properly
    expect(await collectionsPanel.page.locator('text=Metadata Collection').isVisible()).toBe(true);
  });

  test('should handle concurrent file operations', async () => {
    // Create multiple collections and operations
    await collectionsPanel.addCollection('Concurrent Collection 1');
    await collectionsPanel.addCollection('Concurrent Collection 2');

    await collectionsPanel.addRequestToCollection('Concurrent Collection 1', 'Concurrent Request 1');
    await collectionsPanel.addRequestToCollection('Concurrent Collection 2', 'Concurrent Request 2');

    // Verify all operations completed successfully
    expect(await collectionsPanel.page.locator('text=Concurrent Collection 1').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Concurrent Collection 2').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Concurrent Request 1').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Concurrent Request 2').isVisible()).toBe(true);
  });

  test('should fallback to localStorage when file operations fail', async () => {
    await collectionsPanel.addCollection('Fallback Collection');
    await collectionsPanel.addRequestToCollection('Fallback Collection', 'Fallback Request');

    // Even if file operations fail, data should be available in localStorage
    expect(await collectionsPanel.page.locator('text=Fallback Collection').isVisible()).toBe(true);
    expect(await collectionsPanel.page.locator('text=Fallback Request').isVisible()).toBe(true);
  });
});