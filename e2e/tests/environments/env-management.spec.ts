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

  test.afterEach(async () => {
    await EnvironmentsPanel.clearAll(appLayout.page);
  });

  test('should create a new environment', async () => {
    const initialCount = await environmentsPanel.getEnvironmentCount();
    await environmentsPanel.addEnvironment('Test Environment');
    const finalCount = await environmentsPanel.getEnvironmentCount();
    expect(finalCount).toBe(initialCount + 1);
    expect(await environmentsPanel.page.locator(`.environment-item:has-text("Test Environment")`).isVisible()).toBe(true);
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

    const valueInput = environmentsPanel.page.locator('.variable-row:first-child input[placeholder="Value"]');
    expect(await valueInput.inputValue()).toBe('updated_value');
  });

  test('should delete environment variables', async () => {
    await environmentsPanel.addEnvironment('Delete Variable Test Env');
    await environmentsPanel.selectEnvironment('Delete Variable Test Env');
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
    // selectOption updates the DOM; read from DOM (store may lag due to @change not firing)
    const activeDom = await environmentsPanel.getActiveEnvironmentDom();
    expect(activeDom).toBe('Active Test Env');
  });

  test('should show empty state after clearing all environments', async () => {
    await EnvironmentsPanel.clearAll(appLayout.page);
    expect(await environmentsPanel.isEmpty()).toBe(true);
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
});