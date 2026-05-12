import { Page, Locator } from '@playwright/test';

export class SettingsPanel {
  readonly page: Page;
  readonly settingsContent: Locator;
  readonly themeSection: Locator;
  readonly lightThemeRadio: Locator;
  readonly darkThemeRadio: Locator;
  readonly systemThemeRadio: Locator;
  readonly themeOptions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsContent = page.locator('.settings-content');
    this.themeSection = page.locator('h3:has-text("Theme")');
    this.lightThemeRadio = page.locator('input[value="light"]').first();
    this.darkThemeRadio = page.locator('input[value="dark"]').first();
    this.systemThemeRadio = page.locator('input[value="system"]').first();
    this.themeOptions = page.locator('.grid.grid-cols-3.gap-4');
  }

  async waitForLoad(): Promise<void> {
    await this.settingsContent.waitFor({ state: 'visible', timeout: 5000 });
  }

  async selectLightTheme(): Promise<void> {
    await this.lightThemeRadio.check();
  }

  async selectDarkTheme(): Promise<void> {
    await this.darkThemeRadio.check();
  }

  async selectSystemTheme(): Promise<void> {
    await this.systemThemeRadio.check();
  }

  async getCurrentTheme(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('hailstorm_theme');
    });
  }

  async isDarkThemeApplied(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
  }

  async setStoredTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.page.evaluate((t) => {
      localStorage.setItem('hailstorm_theme', t);
    }, theme);
  }

  async applyThemeClass(dark: boolean): Promise<void> {
    await this.page.evaluate((isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, dark);
  }
}