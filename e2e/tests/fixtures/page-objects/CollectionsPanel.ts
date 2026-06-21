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

  async addFolderToCollection(collectionName: string, folderName?: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Folder').click();
    if (folderName) {
      await this.renameFolder(collectionName, 'New Folder', folderName);
    }
  }

  async addRequestToCollection(collectionName: string, requestName?: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Add Request').click();
    // Note: The name may be set automatically or need to be edited separately
    // For tests, we rely on the default name "New Request" or rename via renameCollection
  }

  async addRequestToFolder(collectionName: string, folderOrRequestName: string, requestName?: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.tree-node:has-text("${folderOrRequestName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Add Request').click();
  }

  async renameCollection(oldName: string, newName: string): Promise<void> {
    const collectionHeader = this.page.locator(`.collection-header:has-text("${oldName}")`);
    await collectionHeader.click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Rename').click();
    const modal = this.page.locator('.rename-modal, input[placeholder="Enter new name"], input[value]');
    if (await modal.isVisible()) {
      await modal.fill(newName);
      await this.page.locator('button:has-text("Save"), button:has-text("Rename"), button:has-text("Confirm")').click();
    }
  }

  async deleteCollection(collectionName: string): Promise<void> {
    await this.rightClickCollection(collectionName);
    await this.page.locator('.context-menu').locator('text=Delete').click();
    // Handle confirmation if modal appears
    const confirmBtn = this.page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
  }

  async getCollectionCount(): Promise<number> {
    return await this.page.locator('.collection-header').count();
  }

  async duplicateRequest(collectionName: string, requestName: string): Promise<void> {
    // Find request within collection - both requests and folders use .tree-node
    const requestNode = this.page.locator(`.tree-node:has-text("${requestName}")`).first();
    await requestNode.click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Duplicate').click();
  }

  async copyRequest(collectionName: string, requestName: string): Promise<void> {
    const requestNode = this.page.locator(`.tree-node:has-text("${requestName}")`).first();
    await requestNode.click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Copy').click();
  }

  async pasteRequest(targetName: string, targetType: 'collection' | 'folder' = 'collection'): Promise<void> {
    if (targetType === 'collection') {
      await this.rightClickCollection(targetName);
    } else {
      await this.page.locator(`.tree-node:has-text("${targetName}")`).click({ button: 'right' });
    }
    const pasteOption = this.page.locator('.context-menu').locator('text=Paste');
    if (await pasteOption.isVisible()) {
      await pasteOption.click();
    }
  }

  async renameFolder(collectionName: string, folderName: string, newName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.tree-node:has-text("${folderName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Rename').click();
    const modal = this.page.locator('.rename-modal input, input[value="${folderName}"] + input');
    if (await modal.isVisible()) {
      await modal.fill(newName);
      await this.page.locator('button:has-text("Save"), button:has-text("Rename"), button:has-text("Confirm")').click();
    }
  }

  async deleteFolder(collectionName: string, folderName: string): Promise<void> {
    await this.expandCollection(collectionName);
    await this.page.locator(`.tree-node:has-text("${folderName}")`).click({ button: 'right' });
    await this.page.locator('.context-menu').locator('text=Delete').click();
    const confirmBtn = this.page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyMessage.isVisible();
  }

  async setDependency(collectionName: string, requestName: string, dependsOnName: string): Promise<void> {
    // This method would interact with the request panel to set up dependencies
    // Implementation depends on UI interaction for dependency selection
    const select = this.page.locator('.request-panel select').first();
    if (await select.isVisible()) {
      const options = await select.locator('option').allTextContents();
      const depOption = options.find(opt => opt.includes(dependsOnName));
      if (depOption) {
        await select.selectOption({ label: depOption });
      }
    }
  }

  async runAllInCollection(collectionName: string): Promise<void> {
    // Run all requests in a collection - implementation depends on runner integration
    await this.page.evaluate(() => {
      const runButtons = document.querySelectorAll('.request-node .run-btn');
      runButtons.forEach(btn => (btn as HTMLElement).click());
    });
  }

  async getLastEntriesFor(requestName: string): Promise<any[]> {
    // Get last entries from localStorage history
    return await this.page.evaluate((reqName) => {
      const history = JSON.parse(localStorage.getItem('history') || '[]');
      return history.filter((entry: any) => entry.request?.name === reqName);
    }, requestName);
  }

  async selectRequest(requestName: string): Promise<void> {
    const requestNode = this.page.locator(`.tree-node:has-text("${requestName}")`).first();
    await requestNode.locator('[role="button"]').click();
  }
}