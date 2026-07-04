import { Page, Locator } from '@playwright/test';

export class SettingsPanel {
   readonly page: Page;
   readonly panel: Locator;
   readonly themeSection: Locator;
   readonly lightThemeRadio: Locator;
   readonly darkThemeRadio: Locator;
   readonly systemThemeRadio: Locator;
   readonly logLevelSelect: Locator;
 
   constructor(page: Page) {
     this.page = page;
     this.panel = page.locator('.settings-panel');
     this.themeSection = page.locator('.setting-group').filter({ hasText: 'Appearance' });
     this.lightThemeRadio = page.locator('input[type="radio"][value="light"]');
     this.darkThemeRadio = page.locator('input[type="radio"][value="dark"]');
     this.systemThemeRadio = page.locator('input[type="radio"][value="system"]');
     this.logLevelSelect = page.locator('select').filter({ has: page.locator('option[value="error"]') }).first();
   }

  async waitForLoad(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
  }

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    switch (theme) {
      case 'light':
        await this.lightThemeRadio.check();
        break;
      case 'dark':
        await this.darkThemeRadio.check();
        break;
      case 'system':
        await this.systemThemeRadio.check();
        break;
    }
  }

  async getCurrentTheme(): Promise<string> {
    if (await this.lightThemeRadio.isChecked()) return 'light';
    if (await this.darkThemeRadio.isChecked()) return 'dark';
    if (await this.systemThemeRadio.isChecked()) return 'system';
    return 'unknown';
  }

async isThemeSelected(theme: 'light' | 'dark' | 'system'): Promise<boolean> {
     switch (theme) {
       case 'light':
         return await this.lightThemeRadio.isChecked();
       case 'dark':
         return await this.darkThemeRadio.isChecked();
       case 'system':
         return await this.systemThemeRadio.isChecked();
       default:
         return false;
     }
   }
 
   async setLogLevel(level: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'): Promise<void> {
     await this.logLevelSelect.selectOption(level);
   }
 
   async getLogLevel(): Promise<string> {
     return await this.logLevelSelect.inputValue();
   }
 }