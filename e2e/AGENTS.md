# Kilo Agents for Hailstorm Integration Tests

## Overview
This document provides guidance on using Kilo agents with the Hailstorm integration tests.

## Test Structure
- `/e2e/tests/` - Test files using Playwright
- `/e2e/playwright.config.ts` - Test configuration
- `/e2e/package.json` - Test dependencies and scripts
- `/app/scripts/mock-server.js` - Local mock server for request-type testing

## Supported Request Types to Cover
- HTTP methods, headers, query params, body types, status codes, delays, and auth flows.
- GraphQL query and error endpoints.
- JSON-RPC single and batch request behavior.
- WebSocket echo and broadcast endpoints.
- Shell command execution through the app UI or preload bridge.

## Mock Server for Tests
Start the mock server from `app/` with:

```bash
npm run mock-server
```

Useful endpoints:
- `GET/POST /http/*` for generic HTTP request testing.
- `/http/status/:code`, `/http/delay/:ms`, `/http/error` for status and failure scenarios.
- `/http/auth/basic`, `/http/auth/bearer`, `/http/auth/apikey`, `/http/auth/ntlm` for auth scenarios.
- `/http/form-data`, `/http/raw`, `/http/binary` for body parsing scenarios.
- `/graphql`, `/graphql/errors` for GraphQL success and error scenarios.
- `/json-rpc` for JSON-RPC success and error scenarios.
- `ws://127.0.0.1:4010/ws` and `ws://127.0.0.1:4010/ws/chat` for WebSocket tests.
- `/oauth/token` and `/oauth2/token` for OAuth token retrieval.

## Available Agents

### General Agent
Use for complex, multi-step tasks that require research and execution.
Best for: Refactoring tests, adding new test scenarios, fixing flaky tests.

### Explore Agent
Use for quickly exploring the test codebase to find specific patterns or understand test structure.
Best for: Finding where specific functionality is tested, understanding test organization.

## Common Tasks for Integration Testing

### Exploring the Test Suite
```
Task: Find all tests related to request execution
Agent: explore
Prompt: "Find all test files in e2e/tests related to making HTTP requests"
```

### Adding New Tests
```
Task: Add a test for the new runner feature
Agent: general
Prompt: "Add integration tests for the runner functionality including parallel and sequential execution modes"
```

### Debugging Tests
```
Task: Fix a flaky test in the environment panel
Agent: general
Prompt: "Investigate and fix the flaky test in environments.spec.ts that fails intermittently"
```

## Project-Specific Guidelines

### Test Organization
- Test files are in `e2e/tests/` directory
- Each major feature should have its own test file (e.g. electron.spec.ts, runner.spec.ts)
- Use descriptive test names that clearly indicate what is being tested

### Test Framework
- Uses Playwright for end-to-end testing
- Tests run against the actual Electron application
- Utilizes the IPC bridge exposed via preload script for testing core functionality

### Writing Tests
- Use `test.describe` to group related tests
- Use `test.beforeEach` and `test.afterEach` for setup/teardown
- Leverage Playwright's built-in assertions with `expect`
- Use `test.use()` to configure test-specific options when needed

### Best Practices
- Keep tests independent and isolated
- Use proper cleanup to avoid state pollution between tests
- Test both positive and negative scenarios
- Use data-testid attributes when needed for reliable selectors
- Avoid hardcoded waits; use Playwright's auto-waiting and explicit waits
- Start `npm run mock-server` from `app/` before tests that need local endpoints

## Test Examples

### Example 1: Basic Request Test
```
Task: Test GET request to the local mock server
Test:
test('GET request returns 200 OK from mock server', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:4010/http/get');
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
});
```

### Example 2: JSON-RPC Request Test
```
Task: Test JSON-RPC mock endpoint
Test:
test('JSON-RPC mock endpoint returns calculated result', async ({ request }) => {
  const response = await request.post('http://127.0.0.1:4010/json-rpc', {
    data: { jsonrpc: '2.0', method: 'add', params: [2, 3], id: 1 }
  });
  expect(await response.json()).toMatchObject({ result: 5 });
});
```

### Example 3: Testing Runner Functionality
```
Task: Test parallel execution mode
Agent: general
Prompt: "Add integration tests for the runner functionality including parallel and sequential execution modes"
```
