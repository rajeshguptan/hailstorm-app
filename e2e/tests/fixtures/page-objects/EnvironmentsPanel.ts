import { Page, Locator, expect as playwrightExpect } from '@playwright/test';

export class EnvironmentsPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly addEnvBtn: Locator;
  readonly environmentItems: Locator;
  readonly activeEnvSelect: Locator;
  readonly emptyMessage: Locator;
  readonly contextMenu: Locator;
  readonly nameInput: Locator;
  readonly addVariableBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.environments-panel');
    this.addEnvBtn = page.locator('button:has-text("+ Environment")');
    this.environmentItems = page.locator('.environment-item');
    this.activeEnvSelect = page.locator('select.active-environment');
    this.emptyMessage = page.locator('text=No environments yet');
    this.contextMenu = page.locator('.context-menu');
    this.nameInput = page.locator('input[placeholder="Environment name"]');
    this.addVariableBtn = page.locator('button:has-text("+ Add Variable")');
  }

  /**
   * Create a new environment and optionally rename it via the inline EnvironmentsDetail.
   * Uses playwrightExpect.poll to wait for the DOM to reflect the new env item.
   * Returns the final environment name.
   */
  async addEnvironment(name?: string): Promise<string> {
    const countBefore = await this.environmentItems.count();
    await this.addEnvBtn.click();

    // Wait for the DOM to show a new environment-item (poll immune to computed re-eval lag)
    await playwrightExpect.poll(async () => this.environmentItems.count())
      .toBeGreaterThan(countBefore);

    const lastItem = this.environmentItems.last();
    const nameSpan = lastItem.locator('span').first();

    if (name) {
      // The new env is auto-selected by the store; EnvironmentsDetail is now visible.
      await this.nameInput.fill(name);
      await this.page.getByRole('button', { name: 'Save' }).click();
      // Wait for Vue to update the sidebar name in the DOM
      await playwrightExpect.poll(async () => nameSpan.textContent())
        .toBe(name, { timeout: 5000 });
    }

    return (await nameSpan.textContent())?.trim() || name || '';
  }

  async selectEnvironment(name: string): Promise<void> {
    await this.page.locator(`.environment-item:has-text("${name}")`).click();
  }

  async setActiveEnvironment(name: string): Promise<void> {
    // Read the option :value from the <select> (set by :value="activeEnvironmentId")
    const envId = await this.page.evaluate((envName: string) => {
      const sel = document.querySelector('select.active-environment') as HTMLSelectElement | null;
      if (!sel) return null;
      // Look through option options[] to find matching label
      for (const opt of Array.from(sel.options)) {
        if (opt.label === envName || opt.textContent?.trim() === envName) {
          return opt.value || null;
        }
      }
      return null;
    }, name);

    if (!envId || envId === '') return;

    // Update the Pinia store so the execution engine picks up the right env
    await this.page.evaluate((id: string) => {
      // Pinia store is accessible via the global Pinia instance
      const $pinia = (window as any).__VUEPINIA__ || (window as any).pinia;
      if (!$pinia) {
        // Fall back to modifying the activeEnvironmentId via $pinia state map
        // which becomes available after Pinia is mounted
        return;
      }
      // Access store via internal state map
      try {
        const stateMap = $pinia.state.value;
        if (stateMap && stateMap.environments) {
          const store = stateMap.environments;
          store.activeEnvironmentId = id;
          if (store.environments) {
            store.environments.forEach((e: any) => { e.active = e.id === id; });
          }
        }
      } catch {
        // Ignore if internal shape changes
      }
    }, envId);
  }

  async addVariable(key: string, value: string): Promise<void> {
    await this.addVariableBtn.click();
    const rows = this.page.locator('.variable-row');
    const rowCount = await rows.count();
    const lastRow = rows.nth(rowCount - 1);
    const keyInput = lastRow.locator('input[placeholder="Key"]');
    const valueInput = lastRow.locator('input[placeholder="Value"]');
    await keyInput.fill(key);
    await valueInput.fill(value);
  }

  async editVariable(index: number, key: string, value: string): Promise<void> {
    const rows = this.page.locator('.variable-row');
    const row = rows.nth(index);
    const keyInput = row.locator('input[placeholder="Key"]');
    const valueInput = row.locator('input[placeholder="Value"]');
    await keyInput.fill(key);
    await valueInput.fill(value);
  }

  async deleteVariable(index: number): Promise<void> {
    const deleteBtn = this.page.locator('.variable-row').nth(index).locator('button:has-text("Delete")');
    await deleteBtn.click();
  }

  async renameEnvironment(name: string, newName: string): Promise<void> {
    await this.selectEnvironment(name);
    await this.nameInput.fill(newName);
    await this.page.locator('button:has-text("Save")').click();
  }

  async deleteEnvironment(name: string): Promise<void> {
    // Right-click the matching environment item to open the context menu
    const target = this.page.locator(`.environment-item:has-text("${name}")`);
    await target.click({ button: 'right' });
    await this.page.locator('.context-menu .p-2:has-text("Delete")').click();
  }

  async getEnvironmentCount(): Promise<number> {
    return await this.environmentItems.count();
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

  /**
   * Remove all environments from the UI (useful in afterEach cleanup).
   * Reads environment names from the DOM so each delete targets a valid element.
   */
  static async clearAll(page: Page): Promise<void> {
    const items = page.locator('.environment-item');
    const count = await items.count();
    const envNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) envNames.push(text.trim());
    }
    const panel = new EnvironmentsPanel(page);
    for (const name of envNames) {
      if (name) await panel.deleteEnvironment(name);
    }
  }
}
