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
    this.methodSelect = page.locator('.request-panel select.method');
    this.urlInput = page.locator('.request-panel input.url');
    this.sendBtn = page.locator('.request-panel button:has-text("Send")');
    this.tabs = {
      params: page.locator('.request-panel .tab:has-text("Params")'),
      auth: page.locator('.request-panel .tab:has-text("Auth")'),
      headers: page.locator('.request-panel .tab:has-text("Headers")'),
      body: page.locator('.request-panel .tab:has-text("Body")'),
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
    await this.page.locator('.headers-section button.add-header').click();
    const keyInput = this.page.locator('.header-row:last-child input.key');
    const valueInput = this.page.locator('.header-row:last-child input.value');
    await keyInput.fill(key);
    await valueInput.fill(value);
  }

  async setBody(body: string, type: 'json' | 'text' | 'form-data' = 'json'): Promise<void> {
    await this.tabs.body.click();
    const typeSelect = this.page.locator('.body-section select.body-type');
    await typeSelect.selectOption(type);
    const bodyTextarea = this.page.locator('.body-section textarea');
    await bodyTextarea.fill(body);
  }

  async setAuth(type: 'none' | 'basic' | 'bearer' | 'api-key', config: any = {}): Promise<void> {
    await this.tabs.auth.click();
    const authSelect = this.page.locator('.auth-section select.auth-type');
    await authSelect.selectOption(type);

    if (type === 'basic') {
      await this.page.locator('input[placeholder="Username"]').fill(config.username);
      await this.page.locator('input[placeholder="Password"]').fill(config.password);
    } else if (type === 'bearer') {
      await this.page.locator('input[placeholder="Token"]').fill(config.token);
    } else if (type === 'api-key') {
      await this.page.locator('input[placeholder="Key"]').fill(config.key);
      await this.page.locator('input[placeholder="Value"]').fill(config.value);
      await this.page.locator('select[name="in"]').selectOption(config.in || 'header');
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

  async waitForResponse(): Promise<void> {
    await this.responsePanel.waitFor({ state: 'visible' });
  }
}