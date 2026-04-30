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
    this.panel = page.locator('.sidebar'); // Assuming collections are in sidebar
    this.addCollectionBtn = page.locator('text=+ Collection');
    this.importBtn = page.locator('button:has-text("Import")');
    this.collectionsTree = page.locator('.collection-item').locator('..'); // Parent of collection items
    this.emptyMessage = page.locator('text=No collections yet');
  }

  async addCollection(name?: string): Promise<void> {
    await this.addCollectionBtn.click();
    if (name) {
      await this.renameCollection('New Collection', name);
    }
  }

  async selectCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}")`).click();
  }

  async expandCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}")`).click();
  }

  async expandFolder(collectionName: string, folderName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.request-item:has-text("${folderName}")`).click();
  }

  async rightClickCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}")`).click({ button: 'right' });
    // Wait for context menu
    await this.page.waitForSelector('.context-menu', { timeout: 5000 });
    await this.page.waitForTimeout(500);
  }

  async addFolderToCollection(collectionName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Folder').click();
  }

  async addRequestToCollection(collectionName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async addRequestToFolder(collectionName: string, folderName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.request-item:has-text("${folderName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async renameCollection(oldName: string, newName: string): Promise<void> {
    await this.rightClickCollection(oldName);
    await this.page.locator('.context-menu div').first().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('input[placeholder="Enter new name"]').fill(newName);
    await this.page.locator('button:has-text("Rename")').click();
  }

  async deleteCollection(name: string): Promise<void> {
    await this.rightClickCollection(name);
    await this.page.locator('.context-menu').locator('text=Delete').click();
    // Confirm dialog if present
    await this.page.locator('button:has-text("Delete")').click();
  }

  async importCollection(filePath: string): Promise<void> {
    // This would involve file upload dialog, may need special handling
    await this.importBtn.click();
    // Handle file picker
  }

  async getCollectionCount(): Promise<number> {
    return await this.page.locator('.collection-item').count();
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyMessage.isVisible();
  }
}