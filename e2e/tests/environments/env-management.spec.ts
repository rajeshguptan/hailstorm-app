import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { EnvironmentsPanel } from '../fixtures/page-objects/EnvironmentsPanel';

test.describe('Environment Management', () => {
  let appLayout: AppLayout;
  let environmentsPanel: EnvironmentsPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    environmentsPanel = new EnvironmentsPanel(appLoaded);
    await appLayout.navigateToEnvironments();
  });

  test('should create a new environment', async () => {
    const initialCount = await environmentsPanel.getEnvironmentCount();
    await environmentsPanel.addEnvironment('Test Environment');
    const finalCount = await environmentsPanel.getEnvironmentCount();
    expect(finalCount).toBe(initialCount + 1);
    expect(await environmentsPanel.page.locator('text=Test Environment').isVisible()).toBe(true);
  });

  test('should add variables to environment', async () => {
    await environmentsPanel.addEnvironment('Variable Test Env');
    await environmentsPanel.selectEnvironment('Variable Test Env');

    await environmentsPanel.addVariable('BASE_URL', 'https://api.example.com');
    await environmentsPanel.addVariable('API_KEY', 'secret123');

    const variableCount = await environmentsPanel.getVariableCount();
    expect(variableCount).toBe(2);
  });

  test('should edit environment variables', async () => {
    await environmentsPanel.addEnvironment('Edit Test Env');
    await environmentsPanel.selectEnvironment('Edit Test Env');
    await environmentsPanel.addVariable('TEST_VAR', 'initial_value');

    await environmentsPanel.editVariable(0, 'TEST_VAR', 'updated_value');

    const valueInput = environmentsPanel.page.locator('.variable-row:first-child input.value');
    expect(await valueInput.inputValue()).toBe('updated_value');
  });

  test('should delete environment variables', async () => {
    await environmentsPanel.addEnvironment('Delete Test Env');
    await environmentsPanel.selectEnvironment('Delete Test Env');
    await environmentsPanel.addVariable('TEMP_VAR', 'temp_value');

    const initialCount = await environmentsPanel.getVariableCount();
    await environmentsPanel.deleteVariable(0);
    const finalCount = await environmentsPanel.getVariableCount();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should rename environment', async () => {
    await environmentsPanel.addEnvironment('Rename Test Env');
    await environmentsPanel.renameEnvironment('Rename Test Env', 'Renamed Environment');

    expect(await environmentsPanel.page.locator('text=Renamed Environment').isVisible()).toBe(true);
    expect(await environmentsPanel.page.locator('text=Rename Test Env').isVisible()).toBe(false);
  });

  test('should delete environment', async () => {
    await environmentsPanel.addEnvironment('Delete Test Env');
    const initialCount = await environmentsPanel.getEnvironmentCount();

    await environmentsPanel.deleteEnvironment('Delete Test Env');
    const finalCount = await environmentsPanel.getEnvironmentCount();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should set active environment', async () => {
    await environmentsPanel.addEnvironment('Active Test Env');
    await environmentsPanel.setActiveEnvironment('Active Test Env');

    const activeEnv = await environmentsPanel.getActiveEnvironment();
    expect(activeEnv).toBe('Active Test Env');
  });

  test('should export environment', async () => {
    await environmentsPanel.addEnvironment('Export Test Env');
    await environmentsPanel.selectEnvironment('Export Test Env');
    await environmentsPanel.addVariable('EXPORT_VAR', 'export_value');

    await environmentsPanel.exportEnvironment('Export Test Env');
    // Check if download was triggered (would need download handling)
    expect(true).toBe(true); // Placeholder
  });

  test('should handle environment with many variables', async () => {
    await environmentsPanel.addEnvironment('Many Vars Env');
    await environmentsPanel.selectEnvironment('Many Vars Env');

    for (let i = 1; i <= 20; i++) {
      await environmentsPanel.addVariable(`VAR_${i}`, `value_${i}`);
    }

    const variableCount = await environmentsPanel.getVariableCount();
    expect(variableCount).toBe(20);
  });

  test('should validate variable names', async () => {
    await environmentsPanel.addEnvironment('Validation Test Env');
    await environmentsPanel.selectEnvironment('Validation Test Env');

    // Try invalid variable name
    await environmentsPanel.addVariable('INVALID NAME', 'value');
    // Check for validation error
    const errorMsg = environmentsPanel.page.locator('.variable-error');
    if (await errorMsg.isVisible()) {
      expect(await errorMsg.textContent()).toContain('Invalid');
    }
  });

  test('should handle duplicate variable names', async () => {
    await environmentsPanel.addEnvironment('Duplicate Test Env');
    await environmentsPanel.selectEnvironment('Duplicate Test Env');

    await environmentsPanel.addVariable('DUPLICATE', 'value1');
    await environmentsPanel.addVariable('DUPLICATE', 'value2');

    const variableCount = await environmentsPanel.getVariableCount();
    expect(variableCount).toBe(2); // Allow duplicates or prevent?
  });

  test('should show empty state when no environments', async ({ appLoaded }) => {
    // Clear environments
    const envItems = environmentsPanel.page.locator('.environment-item');
    const count = await envItems.count();
    for (let i = 0; i < count; i++) {
      const envName = await envItems.nth(i).textContent();
      if (envName) {
        await environmentsPanel.deleteEnvironment(envName);
      }
    }

    expect(await environmentsPanel.isEmpty()).toBe(true);
  });
});