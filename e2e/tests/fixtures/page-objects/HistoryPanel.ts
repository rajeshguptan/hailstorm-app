import { Page, Locator } from '@playwright/test';

export class HistoryPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly searchInput: Locator;
  readonly clearHistoryBtn: Locator;
  readonly historyItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.history-panel');
    this.searchInput = page.locator('.history-panel input[type="text"]');
    this.clearHistoryBtn = page.locator('.history-panel button:has-text("Clear History")');
    this.historyItems = page.locator('.history-item');
  }

  async waitForLoad(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
  }

  async searchHistory(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearHistory(): Promise<void> {
    await this.clearHistoryBtn.click();
  }

  async getHistoryItemCount(): Promise<number> {
    return await this.historyItems.count();
  }

  async getHistoryItem(index: number): Promise<{
    method: string;
    name: string;
    url: string;
    status: number;
    time: number;
    timestamp: string;
  }> {
    const item = this.historyItems.nth(index);
    const method = await item.locator('.badge').textContent();
    const name = await item.locator('.history-item-name').textContent();
    const url = await item.locator('.history-item-url').textContent();
    const statusText = await item.locator('.text-green-500, .text-red-500').textContent();
    const timeText = await item.locator('.text-zinc-400').textContent();
    const timestamp = await item.locator('.text-zinc-500').textContent();

    return {
      method: method || '',
      name: name || '',
      url: url || '',
      status: parseInt(statusText || '0'),
      time: parseInt(timeText?.replace('ms', '') || '0'),
      timestamp: timestamp || ''
    };
  }

  async clickHistoryItem(index: number): Promise<void> {
    await this.historyItems.nth(index).click();
  }

  async getEmptyStateText(): Promise<string> {
    const emptyState = this.panel.locator('.text-center');
    return await emptyState.textContent() || '';
  }

  async isEmpty(): Promise<boolean> {
    return await this.historyItems.count() === 0;
  }
}