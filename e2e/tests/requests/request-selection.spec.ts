import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

const seededCollectionData = JSON.stringify({
  collections: [{
    id: 'coll',
    name: 'Test Collection',
    items: [
      {
        id: 'req1',
        name: 'Request One',
        method: 'GET',
        url: 'https://example.com/one',
        headers: [],
        body: { type: 'none', content: '' }
      },
      {
        id: 'req2',
        name: 'Request Two',
        method: 'POST',
        url: 'https://example.com/two',
        headers: [],
        body: { type: 'none', content: '' }
      }
    ],
    variables: []
  }],
  selectedCollectionId: 'coll',
  activeSidebar: 'collections',
  sidebarTitle: 'Collections',
  currentRequest: {
    id: '',
    name: '',
    method: 'GET',
    url: '',
    headers: [],
    body: { type: 'none', content: '' }
  },
  urlParams: [],
  requestHeaders: [],
  activeRequestTab: 'params',
  tabs: [],
  activeTabId: null,
  selectedRequestId: null,
  environments: [],
  activeEnvironmentId: null,
  response: null,
  activeResponseTab: 'body',
  history: [],
  runConfigs: [],
  selectedConfigId: null,
  settingsCategories: [],
  selectedSettingId: null,
  selectedSubSettingId: null,
  selectedSecretId: null
});

test.describe('Request Selection', () => {
  test('should load request details on first sidebar selection', async ({ appLoaded, page }) => {
    const appLayout = new AppLayout(appLoaded);
    const collectionsPanel = new CollectionsPanel(appLoaded);
    const requestPanel = new RequestPanel(appLoaded);

    await page.evaluate((data) => {
      localStorage.setItem('hailstorm-data', data);
    }, seededCollectionData);
    await page.reload();

    await appLayout.navigateToCollections();
    await collectionsPanel.selectCollection('Test Collection');
    await collectionsPanel.selectRequest('Request One');

    await expect(requestPanel.nameInput).toHaveValue('Request One');
    await expect(requestPanel.urlInput).toHaveValue('https://example.com/one');
  });
});
