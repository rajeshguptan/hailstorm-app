import { Page, Locator } from '@playwright/test';

export class RunnerPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly createConfigBtn: Locator;
  readonly runBtn: Locator;
  readonly stopBtn: Locator;
  readonly configNameInput: Locator;
  readonly collectionSelect: Locator;
  readonly repeatRunCheckbox: Locator;
  readonly durationInput: Locator;
  readonly requestTable: Locator;
  readonly resultsPanel: Locator;
  readonly emptyState: Locator;
  readonly configItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-testid="runner-panel"]');
    this.createConfigBtn = page.locator('button:has-text("Create Run Config")');
    this.runBtn = page.locator('[data-testid="runner-run-btn"]');
    this.stopBtn = page.locator('[data-testid="runner-stop-btn"]');
    this.configNameInput = page.locator('[data-testid="runner-config-name-input"]');
    this.collectionSelect = page.locator('.runner-panel select').first();
    this.repeatRunCheckbox = page.locator('.runner-panel input[type="checkbox"]');
    this.durationInput = page.locator('.runner-panel input[type="number"]');
    this.requestTable = page.locator('.runner-panel table');
    this.resultsPanel = page.locator('.results');
    this.emptyState = page.locator('[data-testid="runner-empty-state"]');
    this.configItems = page.locator('[data-testid^="run-config-item-"]');
  }

  async waitForLoad(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
  }

  async createRunConfig(name: string, collectionName: string): Promise<void> {
    // Click create button if it exists - config is now always editable
    if (await this.createConfigBtn.isVisible()) {
      await this.createConfigBtn.click();
      await this.configNameInput.fill(name);
      await this.collectionSelect.selectOption({ label: collectionName });
    }
  }

  async getSelectedConfigName(): Promise<string> {
    return await this.configNameInput.inputValue();
  }

  async selectRequest(requestName: string): Promise<void> {
    const checkbox = this.panel.locator(`tr:has-text("${requestName}") td input[type="checkbox"]`);
    await checkbox.check();
  }

  async setRequestRPS(requestName: string, rps: number): Promise<void> {
    const rpsInput = this.panel.locator(`tr:has-text("${requestName}") td input[type="number"]`);
    await rpsInput.fill(rps.toString());
  }

  async setRequestUrl(requestName: string, url: string): Promise<void> {
    // This would need to be implemented if URL editing is supported in runner
    // For now, assume URLs are set at collection level
  }

  async enableRepeatedRun(duration: number): Promise<void> {
    await this.repeatRunCheckbox.check();
    await this.durationInput.fill(duration.toString());
  }

  async runCollection(): Promise<void> {
    await this.runBtn.click();
  }

  async stopRun(): Promise<void> {
    await this.stopBtn.click();
  }

  async waitForRunCompletion(): Promise<void> {
    // Wait for run button to become enabled again (indicating completion)
    await this.runBtn.waitFor({ state: 'visible', timeout: 60000 });
  }

  async getResults(): Promise<Array<{method: string, status: number, time: number}>> {
    const results: Array<{method: string, status: number, time: number}> = [];

    const resultElements = this.panel.locator('.results .result-item');
    const count = await resultElements.count();

    for (let i = 0; i < count; i++) {
      const element = resultElements.nth(i);
      const method = await element.locator('.badge').textContent();
      const statusText = await element.locator('.status').textContent();
      const timeText = await element.locator('.time').textContent();

      const status = parseInt(statusText || '0');
      const time = parseInt(timeText?.replace('ms', '') || '0');

      results.push({
        method: method || '',
        status,
        time
      });
    }

    return results;
  }

  async isRunning(): Promise<boolean> {
    return await this.stopBtn.isVisible();
  }

  async setConfigName(name: string): Promise<void> {
    await this.configNameInput.fill(name);
  }

  async duplicateConfig(sourceName: string, newName: string): Promise<void> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.configItems.locator(`[data-run-config-name="${sourceName.replace(/"/g, '\\"')}"]`).locator('[data-testid="run-config-more-btn"]').first().click();
    const dialog = await dialogPromise;
    await dialog.accept(newName);
  }

  async deleteConfig(name: string): Promise<void> {
    await this.configItems.locator(`[data-run-config-name="${name.replace(/"/g, '\\"')}"]`).locator('[data-testid="run-config-more-btn"]').first().click();
    await this.page.locator('[data-testid="context-menu-delete"]').click();
  }

  async getAvailableConfigs(): Promise<string[]> {
    const configs: string[] = [];
    const count = await this.configItems.count();

    for (let i = 0; i < count; i++) {
      const name = await this.configItems.nth(i).locator('[data-run-config-name]').getAttribute('data-run-config-name');
      if (name) {
        configs.push(name);
      }
    }

    return configs;
  }

  async mockFileSelection(requestName: string, filePath: string): Promise<void> {
    // Mock the file selection for testing
    const browseBtn = this.panel.locator(`tr:has-text("${requestName}") button:has-text("Browse")`);
    await browseBtn.click();
    // In real implementation, this would mock the file dialog
  }

  async getRequestDataFile(requestName: string): Promise<string> {
    const dataFileInput = this.panel.locator(`tr:has-text("${requestName}") input[readonly]`);
    return await dataFileInput.inputValue();
  }
}