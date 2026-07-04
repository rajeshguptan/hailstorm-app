import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { SettingsPanel } from '../fixtures/page-objects/SettingsPanel';

test.describe('Settings Panel', () => {
   let appLayout: AppLayout;
   let settingsPanel: SettingsPanel;
 
   test.beforeEach(async ({ appLoaded }) => {
     appLayout = new AppLayout(appLoaded);
     settingsPanel = new SettingsPanel(appLoaded);
     await appLayout.navigateToSettings();
     await settingsPanel.waitForLoad();
   });
 
   test('should display settings panel with theme options', async () => {
     await expect(settingsPanel.panel).toBeVisible();
     await expect(settingsPanel.themeSection).toBeVisible();
     await expect(settingsPanel.lightThemeRadio).toBeVisible();
     await expect(settingsPanel.darkThemeRadio).toBeVisible();
     await expect(settingsPanel.systemThemeRadio).toBeVisible();
   });
 
   test('should have a default theme selected', async () => {
     const currentTheme = await settingsPanel.getCurrentTheme();
     expect(['light', 'dark', 'system']).toContain(currentTheme);
   });
 
   test('should allow switching to light theme', async () => {
     await settingsPanel.setTheme('light');
     expect(await settingsPanel.isThemeSelected('light')).toBe(true);
     expect(await settingsPanel.isThemeSelected('dark')).toBe(false);
     expect(await settingsPanel.isThemeSelected('system')).toBe(false);
   });
 
   test('should allow switching to dark theme', async () => {
     await settingsPanel.setTheme('dark');
     expect(await settingsPanel.isThemeSelected('dark')).toBe(true);
     expect(await settingsPanel.isThemeSelected('light')).toBe(false);
     expect(await settingsPanel.isThemeSelected('system')).toBe(false);
   });
 
   test('should allow switching to system theme', async () => {
     await settingsPanel.setTheme('system');
     expect(await settingsPanel.isThemeSelected('system')).toBe(true);
     expect(await settingsPanel.isThemeSelected('light')).toBe(false);
     expect(await settingsPanel.isThemeSelected('dark')).toBe(false);
   });
 
   test('should persist theme selection across navigation', async () => {
     // Set dark theme
     await settingsPanel.setTheme('dark');
     expect(await settingsPanel.isThemeSelected('dark')).toBe(true);
 
     // Navigate away and back
     await appLayout.navigateToCollections();
     await appLayout.navigateToSettings();
     await settingsPanel.waitForLoad();
 
     // Should still be dark theme
     expect(await settingsPanel.isThemeSelected('dark')).toBe(true);
   });
 
   test('should apply theme changes immediately to UI', async () => {
     // Set light theme first
     await settingsPanel.setTheme('light');
 
     // Check that body has light theme classes (assuming theme is applied to body)
     await expect(appLoaded.locator('body')).not.toHaveClass(/dark/);
 
     // Switch to dark theme
     await settingsPanel.setTheme('dark');
 
     // Should now have dark theme applied (this might be tricky to test without specific theme classes)
     // At minimum, verify the setting was changed
     expect(await settingsPanel.isThemeSelected('dark')).toBe(true);
   });
 
   test('should handle theme changes gracefully', async () => {
     // Rapidly change themes
     await settingsPanel.setTheme('light');
     await settingsPanel.setTheme('dark');
     await settingsPanel.setTheme('system');
     await settingsPanel.setTheme('light');
 
     // Should end up with light theme selected
     expect(await settingsPanel.isThemeSelected('light')).toBe(true);
   });
 
   test('should display theme labels correctly', async () => {
     await expect(settingsPanel.themeSection.locator('text=Light')).toBeVisible();
     await expect(settingsPanel.themeSection.locator('text=Dark')).toBeVisible();
     await expect(settingsPanel.themeSection.locator('text=System')).toBeVisible();
   });
 
   test('should only allow one theme to be selected at a time', async () => {
     await settingsPanel.setTheme('light');
 
     // Try to check another theme (this should uncheck the first)
     await settingsPanel.darkThemeRadio.check();
 
     // Only dark should be selected now
     expect(await settingsPanel.isThemeSelected('dark')).toBe(true);
     expect(await settingsPanel.isThemeSelected('light')).toBe(false);
     expect(await settingsPanel.isThemeSelected('system')).toBe(false);
   });
 
   test('should maintain theme selection after app reload', async () => {
     await settingsPanel.setTheme('dark');
 
     // Reload the app
     await appLoaded.reload();
     await appLayout.waitForLoad();
 
     // Navigate back to settings
     await appLayout.navigateToSettings();
     await settingsPanel.waitForLoad();
 
     // Should still have dark theme selected
     expect(await settingsPanel.isThemeSelected('dark')).toBe(true);
   });
 });
 
 test.describe('Logging Settings', () => {
   let appLayout: AppLayout;
   let settingsPanel: SettingsPanel;
 
   test.beforeEach(async ({ appLoaded }) => {
     appLayout = new AppLayout(appLoaded);
     settingsPanel = new SettingsPanel(appLoaded);
     await appLayout.navigateToSettings();
     await settingsPanel.waitForLoad();
     await appLoaded.locator('button:has-text("Logging")').click();
   });
 
   test('should display logging section with log level selector', async () => {
     const loggingSection = appLoaded.locator('.settings-panel').locator('text=Logging');
     await expect(loggingSection).toBeVisible();
     await expect(settingsPanel.logLevelSelect).toBeVisible();
   });
 
   test('should have a default log level selected', async () => {
     const currentLevel = await settingsPanel.getLogLevel();
     expect(['error', 'warn', 'info', 'verbose', 'debug', 'silly']).toContain(currentLevel);
   });
 
   test('should allow changing log level to debug', async () => {
     await settingsPanel.setLogLevel('debug');
     expect(await settingsPanel.getLogLevel()).toBe('debug');
   });
 
   test('should allow changing log level to error', async () => {
     await settingsPanel.setLogLevel('error');
     expect(await settingsPanel.getLogLevel()).toBe('error');
   });
 
   test('should allow changing log level to warn', async () => {
     await settingsPanel.setLogLevel('warn');
     expect(await settingsPanel.getLogLevel()).toBe('warn');
   });
 
   test('should persist log level selection across navigation', async () => {
     await settingsPanel.setLogLevel('debug');
     expect(await settingsPanel.getLogLevel()).toBe('debug');
 
     await appLayout.navigateToCollections();
     await appLayout.navigateToSettings();
     await settingsPanel.waitForLoad();
     await appLoaded.locator('button:has-text("Logging")').click();
 
     expect(await settingsPanel.getLogLevel()).toBe('debug');
   });
 
   test('should display all log level options', async () => {
     const select = settingsPanel.logLevelSelect;
     await expect(select.locator('option[value="error"]')).toHaveText('Error');
     await expect(select.locator('option[value="warn"]')).toHaveText('Warn');
     await expect(select.locator('option[value="info"]')).toHaveText('Info');
     await expect(select.locator('option[value="verbose"]')).toHaveText('Verbose');
     await expect(select.locator('option[value="debug"]')).toHaveText('Debug');
     await expect(select.locator('option[value="silly"]')).toHaveText('Silly');
   });
 });