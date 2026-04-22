import { Page, Locator } from '@playwright/test';

export class AppLayout {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly collectionsNav: Locator;
  readonly environmentsNav: Locator;
  readonly historyNav: Locator;
  readonly secretsNav: Locator;
  readonly statsNav: Locator;
  readonly utilitiesNav: Locator;
  readonly runnerNav: Locator;
  readonly settingsNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.sidebar-main');
    this.mainContent = page.locator('.main-content');
    this.collectionsNav = page.locator('button:has-text("Collections")');
    this.environmentsNav = page.locator('button:has-text("Environments")');
    this.historyNav = page.locator('button:has-text("History")');
    this.secretsNav = page.locator('button:has-text("Secrets")');
    this.statsNav = page.locator('button:has-text("Stats")');
    this.utilitiesNav = page.locator('button:has-text("Utilities")');
    this.runnerNav = page.locator('button:has-text("Runner")');
    this.settingsNav = page.locator('button:has-text("Settings")');
  }

  async navigateToCollections(): Promise<void> {
    await this.collectionsNav.click();
    await this.page.waitForURL('**/#/collections');
  }

  async navigateToEnvironments(): Promise<void> {
    await this.environmentsNav.click();
    await this.page.waitForURL('**/#/environments');
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