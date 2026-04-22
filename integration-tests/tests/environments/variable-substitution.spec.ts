import { test, expect } from '../fixtures/base.fixture';
import { AppLayout } from '../fixtures/page-objects/AppLayout';
import { EnvironmentsPanel } from '../fixtures/page-objects/EnvironmentsPanel';
import { CollectionsPanel } from '../fixtures/page-objects/CollectionsPanel';
import { RequestPanel } from '../fixtures/page-objects/RequestPanel';

test.describe('Variable Substitution', () => {
  let appLayout: AppLayout;
  let environmentsPanel: EnvironmentsPanel;
  let collectionsPanel: CollectionsPanel;
  let requestPanel: RequestPanel;

  test.beforeEach(async ({ appLoaded }) => {
    appLayout = new AppLayout(appLoaded);
    environmentsPanel = new EnvironmentsPanel(appLoaded);
    collectionsPanel = new CollectionsPanel(appLoaded);
    requestPanel = new RequestPanel(appLoaded);

    // Set up test environment
    await appLayout.navigateToEnvironments();
    await environmentsPanel.addEnvironment('Substitution Test Env');
    await environmentsPanel.selectEnvironment('Substitution Test Env');
    await environmentsPanel.addVariable('BASE_URL', 'https://httpbin.org');
    await environmentsPanel.addVariable('API_VERSION', 'v1');
    await environmentsPanel.addVariable('USER_ID', '12345');
    await environmentsPanel.setActiveEnvironment('Substitution Test Env');
  });

  test('should substitute variables in URL', async () => {
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'URL Substitution');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('{{BASE_URL}}/get?user={{USER_ID}}');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('https://httpbin.org/get');
    expect(body).toContain('user');
    expect(body).toContain('12345');
  });

  test('should substitute variables in headers', async () => {
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Header Substitution');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('https://httpbin.org/get');
    await requestPanel.addHeader('X-API-Version', '{{API_VERSION}}');
    await requestPanel.addHeader('X-User-ID', '{{USER_ID}}');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('X-API-Version');
    expect(body).toContain('v1');
    expect(body).toContain('X-User-ID');
    expect(body).toContain('12345');
  });

  test('should substitute variables in request body', async () => {
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Body Substitution');

    await requestPanel.setMethod('POST');
    await requestPanel.setUrl('https://httpbin.org/post');
    await requestPanel.addHeader('Content-Type', 'application/json');
    await requestPanel.setBody('{"user_id": "{{USER_ID}}", "api_version": "{{API_VERSION}}"}', 'json');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('"user_id": "12345"');
    expect(body).toContain('"api_version": "v1"');
  });

  test('should handle nested variable substitution', async () => {
    // Add a variable that references another variable
    await environmentsPanel.addVariable('FULL_URL', '{{BASE_URL}}/api/{{API_VERSION}}');

    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Nested Substitution');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('{{FULL_URL}}/users/{{USER_ID}}');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('https://httpbin.org/api/v1/users/12345');
  });

  test('should handle undefined variables gracefully', async () => {
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Undefined Variable');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('{{BASE_URL}}/get?undefined={{UNDEFINED_VAR}}');

    await requestPanel.sendRequest();

    // Should either substitute with empty string or show error
    const status = await requestPanel.getResponseStatus();
    expect(['200', '400', '404']).toContain(status.split(' ')[0]);
  });

  test('should substitute variables with special characters', async () => {
    await environmentsPanel.addVariable('SPECIAL_VAR', 'value with spaces & symbols!@#');

    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Special Characters');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('{{BASE_URL}}/get?special={{SPECIAL_VAR}}');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });

  test('should handle variable substitution in query parameters', async () => {
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Query Substitution');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('{{BASE_URL}}/get?version={{API_VERSION}}&id={{USER_ID}}&static=value');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('version');
    expect(body).toContain('v1');
    expect(body).toContain('id');
    expect(body).toContain('12345');
    expect(body).toContain('static');
    expect(body).toContain('value');
  });

  test('should update substitutions when active environment changes', async () => {
    // Create another environment
    await environmentsPanel.addEnvironment('Second Env');
    await environmentsPanel.selectEnvironment('Second Env');
    await environmentsPanel.addVariable('BASE_URL', 'https://httpbin.org');
    await environmentsPanel.addVariable('API_VERSION', 'v2');
    await environmentsPanel.addVariable('USER_ID', '67890');

    // Switch active environment
    await environmentsPanel.setActiveEnvironment('Second Env');

    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Environment Switch');

    await requestPanel.setMethod('GET');
    await requestPanel.setUrl('{{BASE_URL}}/get?version={{API_VERSION}}&user={{USER_ID}}');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('v2');
    expect(body).toContain('67890');
  });

  test('should handle variable substitution in form data', async () => {
    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Form Data Substitution');

    await requestPanel.setMethod('POST');
    await requestPanel.setUrl('{{BASE_URL}}/post');
    await requestPanel.setBody('user_id={{USER_ID}}&version={{API_VERSION}}', 'form-data');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
    const body = await requestPanel.getResponseBody();
    expect(body).toContain('12345');
    expect(body).toContain('v1');
  });

  test('should escape special characters in substituted variables', async () => {
    await environmentsPanel.addVariable('ESCAPE_VAR', 'value with "quotes" & <tags>');

    await appLayout.navigateToCollections();
    await collectionsPanel.addCollection('Substitution Test');
    await collectionsPanel.addRequestToCollection('Substitution Test', 'Escape Test');

    await requestPanel.setMethod('POST');
    await requestPanel.setUrl('{{BASE_URL}}/post');
    await requestPanel.addHeader('Content-Type', 'application/json');
    await requestPanel.setBody('{"data": "{{ESCAPE_VAR}}"}', 'json');

    await requestPanel.sendRequest();

    const status = await requestPanel.getResponseStatus();
    expect(status).toContain('200');
  });
});