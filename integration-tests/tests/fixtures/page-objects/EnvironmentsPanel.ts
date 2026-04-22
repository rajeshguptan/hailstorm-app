import { Page, Locator } from '@playwright/test';

export class EnvironmentsPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly addEnvBtn: Locator;
  readonly environmentsList: Locator;
  readonly activeEnvSelect: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.environments-panel');
    this.addEnvBtn = page.locator('button:has-text("Add Environment")');
    this.environmentsList = page.locator('.environments-list');
    this.activeEnvSelect = page.locator('select.active-environment');
    this.emptyMessage = page.locator('text=No environments yet');
  }

  async addEnvironment(name: string): Promise<void> {
    await this.addEnvBtn.click();
    const input = this.page.locator('input[placeholder*="environment name"]');
    await input.fill(name);
    await input.press('Enter');
  }

  async selectEnvironment(name: string): Promise<void> {
    await this.page.locator(`.environment-item:has-text("${name}")`).click();
  }

  async setActiveEnvironment(name: string): Promise<void> {
    await this.activeEnvSelect.selectOption(name);
  }

  async addVariable(key: string, value: string): Promise<void> {
    await this.page.locator('button.add-variable').click();
    const keyInput = this.page.locator('.variable-row:last-child input.key');
    const valueInput = this.page.locator('.variable-row:last-child input.value');
    await keyInput.fill(key);
    await valueInput.fill(value);
  }

  async editVariable(index: number, key: string, value: string): Promise<void> {
    const keyInput = this.page.locator(`.variable-row:nth-child(${index + 1}) input.key`);
    const valueInput = this.page.locator(`.variable-row:nth-child(${index + 1}) input.value`);
    await keyInput.fill(key);
    await valueInput.fill(value);
  }

  async deleteVariable(index: number): Promise<void> {
    await this.page.locator(`.variable-row:nth-child(${index + 1}) button.delete`).click();
  }

  async renameEnvironment(oldName: string, newName: string): Promise<void> {
    await this.selectEnvironment(oldName);
    await this.page.locator('button.rename-environment').click();
    const input = this.page.locator('input[placeholder="New environment name"]');
    await input.fill(newName);
    await input.press('Enter');
  }

  async deleteEnvironment(name: string): Promise<void> {
    await this.selectEnvironment(name);
    await this.page.locator('button.delete-environment').click();
    // Confirm dialog
    await this.page.locator('button:has-text("Delete")').click();
  }

  async exportEnvironment(name: string): Promise<void> {
    await this.selectEnvironment(name);
    await this.page.locator('button.export-environment').click();
  }

  async importEnvironment(filePath: string): Promise<void> {
    await this.page.locator('button.import-environment').click();
    // Handle file upload
  }

  async getEnvironmentCount(): Promise<number> {
    return await this.page.locator('.environment-item').count();
  }

  async getVariableCount(): Promise<number> {
    return await this.page.locator('.variable-row').count();
  }

  async getActiveEnvironment(): Promise<string> {
    return await this.activeEnvSelect.inputValue();
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyMessage.isVisible();
  }
}