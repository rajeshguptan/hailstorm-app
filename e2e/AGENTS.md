# Hailstorm Integration Test Agent Guide

## Overview

This guide is for agents working on Hailstorm's Playwright integration tests. The tests run against the Vite-rendered app at `http://localhost:5173/` and use a browser-side mock `window.api` for IPC-heavy flows unless a test explicitly targets the local mock server.

## Test structure

| Path | Purpose |
| --- | --- |
| `e2e/tests` | Playwright specs |
| `e2e/tests/fixtures/base.fixture.ts` | Shared app-loading fixture and mock `window.api` |
| `e2e/tests/fixtures/page-objects` | Page object models |
| `e2e/playwright.config.ts` | Playwright project configuration |
| `mock-server/server.js` | Local mock server for HTTP/WebSocket/GraphQL/JSON-RPC tests |

## Supported coverage areas

The suite is organized around these product areas:

- Collections and folders
- Request execution and response handling
- Scripts and dependency behavior
- Authentication flows
- Environments and secrets
- Runner and load testing
- Stats reporting
- File-based storage
- Docs and settings
- Electron app shell

## Mock server for tests

Start the local mock server from `mock-server/` when a test needs real HTTP/WebSocket/GraphQL/JSON-RPC endpoints:

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

## Running tests

Install dependencies:

```bash
npm install
```

Start the app dev server from `app/`:

```bash
npm run dev
```

Run all tests:

```bash
npm test
```

Run a single file:

```bash
npx playwright test tests/stats/stats-panel.spec.ts
```

Run a specific project:

```bash
npx playwright test tests/stats/stats-panel.spec.ts --project=stats-tests
```

Run headed mode:

```bash
npm run test:headed
```

## Writing tests

- Use `test.describe` to group related behavior.
- Use `beforeEach` to create isolated collections, requests, or test state.
- Prefer page objects over raw locators in tests.
- Prefer role-based selectors when possible.
- Add `data-testid` attributes for important UI controls when CSS selectors would be brittle.
- Use Playwright auto-waiting and explicit locator waits instead of fixed sleeps.
- Keep tests independent; do not rely on order or shared mutable state.
- Mock IPC with `base.fixture.ts` for UI flow tests.
- Use the local mock server for protocol-level request behavior.

## Page object conventions

- Encapsulate page-specific locators and interactions in `e2e/tests/fixtures/page-objects`.
- Keep assertions in specs, not page objects.
- Return useful typed values from page objects.
- Avoid `first()`, `nth()`, and CSS classes unless there is no stable accessible alternative.
- Do not add arbitrary waits; use `waitFor`, `toBeVisible`, `toHaveText`, or similar assertions.

## Best practices

- Cover positive and negative paths.
- Keep tests fast and deterministic.
- Avoid external network dependence where a mock server or API mock is available.
- Use traces and screenshots on failure for debugging.
- Update page objects when UI structure changes.
- Add or update tests for request execution, collection behavior, runner behavior, secrets, environments, and stats.
