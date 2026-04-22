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

  async addCollection(): Promise<void> {
    await this.addCollectionBtn.click();
  }

  async selectCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}")`).click();
  }

  async expandCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}") .expand-icon`).click();
  }

  async rightClickCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}")`).click({ button: 'right' });
    // Wait for context menu
    await this.page.waitForSelector('.context-menu', { timeout: 5000 });
  }

  async addFolderToCollection(collectionName: string, folderName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu .add-folder').click();
    const input = this.page.locator('input[placeholder*="folder name"]');
    await input.fill(folderName);
    await input.press('Enter');
  }

  async addRequestToCollection(collectionName: string, requestName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu .add-request').click();
    const input = this.page.locator('input[placeholder*="request name"]');
    await input.fill(requestName);
    await input.press('Enter');
  }

  async addRequestToFolder(collectionName: string, folderName: string, requestName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.folder-item:has-text("${folderName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu .add-request').click();
    const input = this.page.locator('input[placeholder*="request name"]');
    await input.fill(requestName);
    await input.press('Enter');
  }

  async renameCollection(oldName: string, newName: string): Promise<void> {
    await this.rightClickCollection(oldName);
    await this.page.locator('text=Rename').click();
    await this.page.locator('input[placeholder="Enter new name"]').fill(newName);
    await this.page.locator('button:has-text("Rename")').click();
  }

  async deleteCollection(name: string): Promise<void> {
    await this.rightClickCollection(name);
    await this.page.locator('.context-menu .delete').click();
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