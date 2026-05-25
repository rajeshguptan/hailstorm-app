import { Page, Locator } from '@playwright/test';

export class CollectionsPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly addCollectionBtn: Locator;
  readonly importBtn: Locator;
  readonly collectionsTree: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.collections-panel');
    this.addCollectionBtn = page.locator('button:has-text("+ Collection")');
    this.importBtn = page.locator('button:has-text("Import")');
    this.collectionsTree = page.locator('.collection-node');
    this.emptyMessage = page.locator('text=No collections yet');
  }

  async addCollection(name?: string): Promise<void> {
    await this.addCollectionBtn.click();
    if (name) {
      await this.renameCollection('New Collection', name);
    }
  }

  async selectCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-header:has-text("${name}")`).click();
  }

  async expandCollection(name: string): Promise<void> {
    // Clicking on collection header both selects and expands it
    await this.selectCollection(name);
  }

  async expandFolder(collectionName: string, folderName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.tree-node:has-text("${folderName}")`).click();
  }

  async rightClickCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-header:has-text("${name}")`).click({ button: 'right' });
    // Wait for context menu
    await this.page.waitForSelector('.context-menu', { timeout: 5000 });
  }

  async addFolderToCollection(collectionName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Folder').click();
  }

  async addRequestToCollection(collectionName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async addRequestToFolder(collectionName: string, folderOrRequestName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.tree-node:has-text("${folderOrRequestName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async toggleRequest(requestId: string): Promise<void> {
    // Helper method for runner panel integration
    await this.page.locator(`[data-id="${requestId}"]`).click();
  }
}