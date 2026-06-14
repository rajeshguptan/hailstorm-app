# Kilo Agents for Hailstorm Integration Tests

## Overview
This document provides guidance on using Kilo agents with the Hailstorm integration tests.

## Test Structure
- `/e2e/tests/` - Test files using Playwright
- `/e2e/playwright.config.ts` - Test configuration
- `/e2e/package.json` - Test dependencies and scripts

### Core Modules Tests
- `/e2e/tests/core-modules/core-modules.spec.ts` - Tests for refactored execution engine modules
  - `httpClient.ts` - HTTP/HTTPS request handling with rate limiting
  - `authHandler.ts` - Authentication and variable substitution utilities
  - `loadTestingService.ts` - Load test data persistence and metrics

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
- Each major feature should have its own test file (e.g., electron.spec.ts, runner.spec.ts)
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

## Test Examples

### Example 1: Basic Request Test
```
Task: Test GET request to httpbin.org
Test: 
test('GET request returns 200 OK', async ({ request }) => {
  const response = await request.get('https://httpbin.org/get');
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
});
```

### Example 2: Testing Runner Functionality
```
Task: Test parallel execution mode
Test:
test('runner executes requests in parallel mode', async ({ page }) => {
  // Navigate to runner view
  await page.click('text=Runner');
  // Select collection and requests
  // Set run mode to parallel
  // Execute run
  // Verify results show correct timing characteristics
});
```

### Example 3: Testing IPC Communication
```
Task: Test that the app properly handles IPC messages
Test:
test('app responds to make-request IPC call', async ({}) => {
  // This would typically be done by exposing test helpers
  // or by testing through the UI that triggers IPC calls
});
```