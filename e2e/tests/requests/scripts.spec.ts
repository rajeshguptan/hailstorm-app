import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

test.describe('Script Tabs', () => {
  let appLayout: AppLayout;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Scripts Test Collection');
    await collectionsPanel.addRequestToCollection('Scripts Test Collection', 'Scripts Test Request');
  });

  test('should have scripts tab visible in request panel', async () => {
    await expect(requestPanel.tabs.scripts).toBeVisible();
  });

  test('should switch between script sub-tabs', async ({ appLoaded }) => {
    await requestPanel.tabs.scripts.click();
    await appLoaded.waitForTimeout(100);

    const preRequestTab = appLoaded.locator('.script-tabs button:has-text("Pre-request Script")');
    const postRequestTab = appLoaded.locator('.script-tabs button:has-text("Post-request Script")');
    const testScriptTab = appLoaded.locator('.script-tabs button:has-text("Test Script")');

    await expect(preRequestTab).toBeVisible();
    await expect(postRequestTab).toBeVisible();
    await expect(testScriptTab).toBeVisible();
  });

  test('should display pre-request script textarea', async () => {
    await requestPanel.tabs.scripts.click();
    const textarea = requestPanel.page.locator('.script-tabs textarea');
    await expect(textarea.first()).toBeVisible();
    expect(await textarea.first().getAttribute('placeholder')).toContain('before request');
  });

  test('should display post-request script textarea', async ({ appLoaded }) => {
    await requestPanel.tabs.scripts.click();
    await appLoaded.locator('.script-tabs button:has-text("Post-request Script")').click();
    const textarea = appLoaded.locator('.script-tabs textarea');
    await expect(textarea).toBeVisible();
    expect(await textarea.getAttribute('placeholder')).toContain('after response');
  });

  test('should display test script textarea', async ({ appLoaded }) => {
    await requestPanel.tabs.scripts.click();
    await appLoaded.locator('.script-tabs button:has-text("Test Script")').click();
    const textarea = appLoaded.locator('.script-tabs textarea');
    await expect(textarea).toBeVisible();
    expect(await textarea.getAttribute('placeholder')).toContain('Test');
  });
});