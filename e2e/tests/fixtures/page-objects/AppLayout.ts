import { Page, Locator } from '@playwright/test';

export class AppLayout {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly collectionsNav: Locator;
  readonly historyNav: Locator;
  readonly secretsNav: Locator;
  readonly statsNav: Locator;
  readonly utilitiesNav: Locator;
  readonly runnerNav: Locator;
  readonly settingsNav: Locator;
  readonly environmentSelect: Locator;
  readonly newEnvironmentNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.sidebar-main');
    this.mainContent = page.locator('.main-content');
    this.collectionsNav = page.locator('button:has-text("Collections")');
    this.historyNav = page.locator('button:has-text("History")');
    this.secretsNav = page.locator('button:has-text("Secrets")');
    this.statsNav = page.locator('button:has-text("Stats")');
    this.utilitiesNav = page.locator('button:has-text("Utilities")');
    this.runnerNav = page.locator('button:has-text("Runner")');
    this.settingsNav = page.locator('button:has-text("Settings")');
    this.environmentSelect = page.locator('.sidebar-header select');
    this.newEnvironmentNameInput = page.locator('input[placeholder="Environment name"]');
  }

  async navigateToCollections(): Promise<void> {
    await this.collectionsNav.click();
    await this.page.waitForURL('**/#/collections');
  }

  async getEnvironmentOptions(): Promise<string[]> {
    return await this.environmentSelect.locator('option').evaluateAll(options =>
      options.map(option => option.textContent?.trim() || '')
    );
  }

  async getActiveEnvironmentLabel(): Promise<string> {
    return await this.environmentSelect.evaluate(select => (select as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() || '');
  }

  async selectNoEnvironment(): Promise<void> {
    await this.environmentSelect.selectOption({ index: 0 });
  }

  async openNewEnvironmentModal(): Promise<void> {
    await this.environmentSelect.selectOption({ label: 'New Env' });
    await this.newEnvironmentNameInput.waitFor({ state: 'visible' });
  }

  async createEnvironmentFromDropdown(name: string): Promise<void> {
    await this.openNewEnvironmentModal();
    await this.newEnvironmentNameInput.fill(name);
    await this.page.getByRole('button', { name: 'Create' }).click();
    await this.newEnvironmentNameInput.waitFor({ state: 'hidden' });
  }

  async navigateToHistory(): Promise<void> {
    await this.historyNav.click();
    await this.page.waitForURL('**/#/history');
  }

  async navigateToSecrets(): Promise<void> {
    await this.secretsNav.click();
    await this.page.waitForURL('**/#/secrets');
  }

  async navigateToStats(): Promise<void> {
    await this.statsNav.click();
    await this.page.waitForURL('**/#/stats');
  }

  async navigateToUtilities(): Promise<void> {
    await this.utilitiesNav.click();
    await this.page.waitForURL('**/#/utilities');
  }

  async navigateToRunner(): Promise<void> {
    await this.runnerNav.click();
    await this.page.waitForURL('**/#/runner');
  }

  async navigateToSettings(): Promise<void> {
    await this.settingsNav.click();
    await this.page.waitForURL('**/#/settings');
  }

  async waitForLoad(): Promise<void> {
    await this.sidebar.waitFor({ state: 'visible' });
    await this.mainContent.waitFor({ state: 'visible' });
  }
}