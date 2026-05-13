import { Page, Locator } from '@playwright/test';

export class RequestPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly methodSelect: Locator;
  readonly urlInput: Locator;
  readonly sendBtn: Locator;
  readonly tabs: {
    params: Locator;
    auth: Locator;
    headers: Locator;
    body: Locator;
  };
  readonly responsePanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.request-panel');
    this.methodSelect = page.locator('.request-panel select');
    this.urlInput = page.locator('.request-panel input[type="text"]').first();
    this.sendBtn = page.locator('.request-panel button:has-text("Send")');
    this.tabs = {
      params: page.locator('.request-panel button:has-text("Parameters")'),
      auth: page.locator('.request-panel button:has-text("Auth")'),
      headers: page.locator('.request-panel button:has-text("Headers")'),
      body: page.locator('.request-panel button:has-text("Body")'),
      variables: page.locator('.request-panel button:has-text("Variables")'),
      scripts: page.locator('.request-panel button:has-text("Scripts")'),
    };
    this.responsePanel = page.locator('.response-panel');
  }

  async setMethod(method: string): Promise<void> {
    await this.methodSelect.selectOption(method);
  }

  async setUrl(url: string): Promise<void> {
    await this.urlInput.fill(url);
  }

  async addHeader(key: string, value: string): Promise<void> {
    await this.tabs.headers.click();
    await this.page.locator('.request-panel button:has-text("+ Add Header")').click();
    const headerRows = this.page.locator('.request-panel .key-value-editor input[placeholder="Key"]');
    const valueInputs = this.page.locator('.request-panel .key-value-editor input[placeholder="Value"]');
    const lastKeyInput = headerRows.last();
    const lastValueInput = valueInputs.last();
    await lastKeyInput.fill(key);
    await lastValueInput.fill(value);
  }

  async setBody(body: string, type: 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'none' = 'raw'): Promise<void> {
    await this.tabs.body.click();
    const typeSelect = this.page.locator('.request-panel select').nth(1); // Second select in the request panel
    await typeSelect.selectOption(type);
    if (type !== 'none') {
      const bodyTextarea = this.page.locator('.request-panel textarea');
      await bodyTextarea.fill(body);
    }
  }

  async setAuth(type: 'noauth' | 'basic' | 'bearer' | 'apikey', config: any = {}): Promise<void> {
    await this.tabs.auth.click();
    const authSelect = this.page.locator('.request-panel select').nth(2); // Third select in the request panel
    await authSelect.selectOption(type);

    if (type === 'basic') {
      await this.page.locator('.request-panel input[placeholder="Username"]').fill(config.username);
      await this.page.locator('.request-panel input[placeholder="Password"]').fill(config.password);
    } else if (type === 'bearer') {
      await this.page.locator('.request-panel input[placeholder="Enter bearer token"]').fill(config.token);
    } else if (type === 'apikey') {
      await this.page.locator('.request-panel input[placeholder="Key"]').first().fill(config.key);
      await this.page.locator('.request-panel input[placeholder="Value"]').first().fill(config.value);
      await this.page.locator('.request-panel select').nth(3).selectOption(config.in || 'header');
    }
  }

  async sendRequest(): Promise<void> {
    await this.sendBtn.click();
    // Wait for response
    await this.page.waitForSelector('.response-panel .status-code', { timeout: 30000 });
  }

  async getResponseStatus(): Promise<string> {
    return await this.page.locator('.response-panel .status-code').textContent();
  }

  async getResponseBody(): Promise<string> {
    return await this.page.locator('.response-panel .response-body').textContent();
  }

  async getResponseTime(): Promise<string> {
    return await this.page.locator('.response-panel .response-time').textContent();
  }

  async getMethod(): Promise<string> {
    return await this.methodSelect.inputValue();
  }

  async getUrl(): Promise<string> {
    return await this.urlInput.inputValue();
  }

  async getHeaders(): Promise<Array<{key: string, value: string, enabled: boolean}>> {
    const headers: Array<{key: string, value: string, enabled: boolean}> = [];
    const headerRows = this.page.locator('.request-panel .key-value-editor');

    const count = await headerRows.count();
    for (let i = 0; i < count; i++) {
      const row = headerRows.nth(i);
      const key = await row.locator('input[placeholder="Key"]').inputValue();
      const value = await row.locator('input[placeholder="Value"]').inputValue();
      const enabled = await row.locator('input[type="checkbox"]').isChecked();

      if (key && value) {
        headers.push({ key, value, enabled });
      }
    }

    return headers;
  }

  async waitForResponse(): Promise<void> {
    await this.responsePanel.waitFor({ state: 'visible' });
  }
}