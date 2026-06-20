import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';

test.describe('Collections Environment Dropdown', () => {
  let appLayout: AppLayout;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    await appLayout.navigateToCollections();
  });

  test('shows a blank no-environment option and New Env action', async () => {
    const options = await appLayout.getEnvironmentOptions();

    expect(options[0]).toBe('');
    expect(options).toContain('New Env');
    expect(options).not.toContain('No Environment');
  });

  test('creates and selects an environment from the New Env modal', async () => {
    await appLayout.createEnvironmentFromDropdown('Production');

    const options = await appLayout.getEnvironmentOptions();
    expect(options).toContain('Production');
    expect(await appLayout.getActiveEnvironmentLabel()).toBe('Production');

    await appLayout.selectNoEnvironment();
    expect(await appLayout.getActiveEnvironmentLabel()).toBe('');
  });
});
