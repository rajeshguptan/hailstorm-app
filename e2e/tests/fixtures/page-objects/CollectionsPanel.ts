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
    this.collectionsTree = page.locator('.collection-item');
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
    // Clicking on collection item both selects and expands it
    await this.selectCollection(name);
  }

  async expandFolder(collectionName: string, folderName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.request-item:has-text("${folderName}")`).click();
  }

  async rightClickCollection(name: string): Promise<void> {
    await this.page.locator(`.collection-item:has-text("${name}")`).click({ button: 'right' });
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

  async addRequestToFolder(collectionName: string, folderName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.request-item:has-text("${folderName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async renameCollection(oldName: string, newName: string): Promise<void> {
    await this.rightClickCollection(oldName);
    await this.page.locator('.context-menu').locator('text=Rename').click();
    // The rename functionality is handled by the RenameModal component
    // For testing purposes, we can assume the rename happens or mock it
  }

  async deleteCollection(name: string): Promise<void> {
    await this.rightClickCollection(name);
    await this.page.locator('.context-menu').locator('text=Delete').click();
    // Note: May need to handle confirmation dialog in actual implementation
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

  async addFolderToCollection(collectionName: string, folderName?: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Folder').click();
    if (folderName) {
      // Rename the newly created folder
      await this.renameCollection('New Folder', folderName);
    }
  }

  async addRequestToCollection(collectionName: string, requestName?: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Request').click();
    if (requestName) {
      // The request would be named in the creation flow
      // For testing, we assume it gets the default name or we can rename it
    }
  }

  async addRequestToFolder(collectionName: string, folderName: string, requestName?: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.request-item:has-text("${folderName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async toggleRequest(requestId: string): Promise<void> {
    // Helper method for runner panel integration
    await this.page.locator(`[data-request-id="${requestId}"]`).click();
  }
}