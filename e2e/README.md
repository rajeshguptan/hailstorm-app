# Hailstorm Integration Tests

This directory contains the Playwright integration test suite for Hailstorm. Tests exercise the Vue renderer, page objects, IPC-facing UI flows, and selected request behavior against local mock services.

## Setup

Install dependencies:

```bash
npm install
```

Start the app dev server from the `app/` directory:

```bash
cd ../app
npm run dev
```

Optional: start the local mock server for HTTP, WebSocket, GraphQL, JSON-RPC, auth, and shell endpoints:

```bash
cd ../app
npm run mock-server
```

The mock server listens on `http://127.0.0.1:4010` by default.

## Running tests

Run all tests:

```bash
npm test
```

Run tests in headed mode:

```bash
npm run test:headed
```

Run a single spec:

```bash
npx playwright test tests/stats/stats-panel.spec.ts
```

Run a specific Playwright project:

```bash
npx playwright test tests/stats/stats-panel.spec.ts --project=stats-tests
```

## Test projects

`playwright.config.ts` defines focused projects for faster local debugging:

| Project | Matches |
| --- | --- |
| `docs-tests` | `tests/docs/**` |
| `stats-tests` | `tests/stats/**` |
| `load-testing` | `tests/**/load-testing.spec.ts` |
| `runner-tests` | `tests/**/runner.spec.ts` |
| `integration-tests` | History, settings, and storage tests |
| `collection-tests` | `tests/collections/**` |
| `request-tests` | `tests/requests/**` |

## Test structure

- `tests/fixtures/base.fixture.ts` loads the app and injects a deterministic mock `window.api`.
- `tests/fixtures/page-objects/` contains reusable page object models.
- `tests/` contains feature-oriented specs.

## Coverage areas

### Collection management

- Create, rename, duplicate, copy, paste, and delete collections.
- Add folders and requests from context menus.
- Support HTTP, GraphQL, JSON-RPC, WebSocket, and shell request creation.
- Validate nested folder behavior and collection tree selection.

### Request execution

- HTTP methods, headers, query parameters, body types, and response rendering.
- GraphQL and JSON-RPC request flows.
- WebSocket connection behavior.
- Shell command execution.
- Authentication flows for bearer, basic, API key, and NTLM-style headers.
- Variable substitution and dependency execution.

### Runner and load testing

- Create and edit run configurations.
- Select requests and configure per-request RPS.
- Run repeated duration-based tests.
- Stop active runs.
- Capture runner results and live stats.
- Persist completed load-test runs and view them in Stats.

### Stats

- Empty state and header controls.
- Completed run selection.
- Live and historical chart rendering.
- Export and delete actions.

### Storage and settings

- File-based collection persistence.
- Workspace selection.
- Settings panel behavior.
- Theme switching.

## Writing new tests

- Put assertions in spec files and interactions in page objects.
- Use role-based selectors where possible.
- Add `data-testid` attributes for important controls when selectors would otherwise depend on layout or styling.
- Avoid fixed waits; prefer Playwright assertions and auto-waiting.
- Mock IPC-heavy flows through `base.fixture.ts`.
- Use the local mock server for protocol-specific endpoint behavior.
- Keep tests independent and avoid relying on execution order.

## Debugging

Use Playwright traces on failure:

```bash
npx playwright show-trace test-results/<path>/trace.zip
```

Run a spec repeatedly when investigating flakiness:

```bash
npx playwright test tests/runner/runner.spec.ts --repeat-each=5
```
