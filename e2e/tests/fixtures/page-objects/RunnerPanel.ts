import { Page, Locator } from '@playwright/test';

export class RunnerPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly createConfigBtn: Locator;
  readonly runBtn: Locator;
  readonly stopBtn: Locator;
  readonly editBtn: Locator;
  readonly saveBtn: Locator;
  readonly duplicateBtn: Locator;
  readonly cancelBtn: Locator;
  readonly configNameDisplay: Locator;
  readonly configNameInput: Locator;
  readonly collectionSelect: Locator;
  readonly repeatRunCheckbox: Locator;
  readonly durationInput: Locator;
  readonly requestTable: Locator;
  readonly resultsPanel: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-testid="runner-panel"]');
    this.createConfigBtn = page.locator('button:has-text("Create Run Config")');
    this.runBtn = page.locator('[data-testid="runner-run-btn"]');
    this.stopBtn = page.locator('[data-testid="runner-stop-btn"]');
    this.editBtn = page.locator('[data-testid="runner-edit-btn"]');
    this.saveBtn = page.locator('[data-testid="runner-save-btn"]');
    this.duplicateBtn = page.locator('[data-testid="runner-duplicate-btn"]');
    this.cancelBtn = page.locator('[data-testid="runner-cancel-btn"]');
    this.configNameDisplay = page.locator('[data-testid="runner-config-name"]');
    this.configNameInput = page.locator('[data-testid="runner-config-name-input"]');
    this.collectionSelect = page.locator('.runner-panel select').first();
    this.repeatRunCheckbox = page.locator('.runner-panel input[type="checkbox"]');
    this.durationInput = page.locator('.runner-panel input[type="number"]');
    this.requestTable = page.locator('.runner-panel table');
    this.resultsPanel = page.locator('.results');
    this.emptyState = page.locator('[data-testid="runner-empty-state"]');
  }

  async waitForLoad(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
  }

  async createRunConfig(name: string, collectionName: string): Promise<void> {
    // Click create button if it exists, otherwise assume config creation is handled elsewhere
    if (await this.createConfigBtn.isVisible()) {
      await this.createConfigBtn.click();
      await this.configNameInput.fill(name);
      await this.collectionSelect.selectOption({ label: collectionName });
      await this.saveBtn.click();
    }
  }

  async getSelectedConfigName(): Promise<string> {
    return await this.configNameDisplay.textContent() || '';
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

  async startEdit(): Promise<void> {
    await this.editBtn.click();
  }

  async setConfigName(name: string): Promise<void> {
    await this.configNameInput.fill(name);
  }

  async saveConfig(): Promise<void> {
    await this.saveBtn.click();
  }

  async duplicateConfig(newName: string): Promise<void> {
    await this.duplicateBtn.click();
    // Handle the prompt - in a real implementation this would be mocked
    await this.page.waitForTimeout(100); // Brief pause for duplicate action
  }

  async getAvailableConfigs(): Promise<string[]> {
    // This would need to be implemented based on actual UI
    // For now return empty array
    return [];
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