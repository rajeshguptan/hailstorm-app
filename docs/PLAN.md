# Hailstorm Roadmap

## Current state

Hailstorm is a local-first Electron + Vue 3 API client with support for HTTP, GraphQL, JSON-RPC, WebSocket, shell commands, environments, secrets, collection runners, and load-test reporting.

The current architecture is production-oriented:

- Electron main process for privileged APIs and IPC.
- Vue 3 renderer for the user interface.
- Pinia stores for local-first state.
- Secure preload bridge for renderer-to-main communication.
- Vite and Electron Forge for development and packaging.
- Playwright integration tests for UI flows.

## Completed foundation

### Application shell

- Electron main process.
- Vue 3 renderer.
- Pinia stores.
- Router and sidebar navigation.
- Settings, docs, console, history, secrets, collections, request editor, runner, and stats views.

### Request execution

- HTTP requests.
- GraphQL requests.
- JSON-RPC requests.
- WebSocket requests.
- Shell command requests.
- Variable substitution.
- Basic, bearer, API key, NTLM-style, OAuth2, and inherited auth handling.
- Request dependencies.
- Request history.

### Collections and environments

- Collection and folder management.
- Request creation from context menus.
- Duplicate, copy, paste, rename, and delete actions.
- Multiple environments.
- Collection, environment, request, and secret variables.
- File-based collection workflows.

### Runner and load testing

- Run configurations.
- Selected request execution.
- Per-request RPS.
- Repeated duration-based runs.
- Stop active runs.
- Live runner results.
- Persistent completed load-test runs.
- Stats panel with live and completed run views.
- JSON and CSV export for completed runs.

### Testing

- Playwright integration suite.
- Page object models.
- Mocked preload API for deterministic UI tests.
- Local mock server for HTTP, GraphQL, JSON-RPC, WebSocket, auth, and shell endpoints.

## Near-term roadmap

### 1. Stabilize and expand tests

Priority: high

- Add stable selectors and page object coverage for Runner and Stats.
- Add tests for request execution edge cases.
- Add tests for environment variable substitution.
- Add tests for secrets behavior.
- Add tests for load-test persistence and export.
- Fix flaky tests that depend on external services.

### 2. Add CI command-line runner

Priority: high

- Accept a RunConfig zip file containing collection, environment, and datafile configuration.
- Execute the selected run configuration without opening the Electron UI.
- Emit deterministic exit codes.
- Write reports suitable for CI logs.
- Preserve existing desktop runner behavior.

### 3. Complete data-driven runner execution

Priority: high

- Load CSV and JSON datafiles.
- Map data rows to request variables.
- Support row iteration in collection runs.
- Record run metadata showing datafile usage.

### 4. Finish test script execution

Priority: medium

- Execute pre-request and test scripts in a safer runtime.
- Provide assertion results in the response panel.
- Add script error reporting.
- Avoid unsafe unrestricted script execution patterns.

### 5. Improve load-test reporting

Priority: medium

- Calculate p50, p95, and p99 response times from persisted data.
- Add richer JSON exports.
- Add optional JUnit or Markdown export for CI.
- Improve Stats chart labels and empty states.

## Medium-term roadmap

### 1. OpenAPI and documentation workflows

- Import OpenAPI/Swagger definitions.
- Generate collections from API specs.
- Generate Markdown documentation from collections.
- Validate requests against schemas.

### 2. CI/CD integration

- Command-line runner with report output.
- Exit codes based on failures and assertions.
- Configurable timeouts and retries.
- JUnit, JSON, and Markdown reports.

### 3. OAuth and advanced auth

- Complete user-facing OAuth2 flows.
- Improve token refresh handling.
- Add clearer auth error states.

### 4. Performance and reliability

- Reduce large response memory usage.
- Add streaming response handling where appropriate.
- Improve load-test concurrency and rate limiting accuracy.
- Add cancellation and cleanup safeguards.

## Long-term roadmap

### 1. Collaboration

- Team workspaces.
- Shared collections.
- Permissions and roles.
- Comments and review workflows.

### 2. Monitoring

- Scheduled API checks.
- Uptime monitoring.
- Alerting.
- Performance trend dashboards.

### 3. Enterprise readiness

- SSO integration.
- Audit logs.
- Data residency options.
- Security policy controls.
- Compliance reporting.

## Out-of-scope for current phase

- gRPC support.
- Native GitHub/Jira integrations.
- AI-powered request generation.
- Full team collaboration.
- Enterprise governance and compliance.
