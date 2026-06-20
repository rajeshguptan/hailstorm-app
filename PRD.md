# Hailstorm Product Requirements

## Executive summary

Hailstorm is a local-first API client for developers, QA engineers, and SREs who need fast request execution, collection automation, and load testing without cloud dependency. It combines a desktop API client with runner workflows, environment-aware variable substitution, secrets management, and persistent load-test reporting.

## Target users

### Backend engineers

- Build and debug REST, GraphQL, JSON-RPC, WebSocket, and shell workflows.
- Keep collections and environments local and portable.
- Use variables, dependencies, and scripts to model realistic API behavior.

### QA engineers and SDETs

- Run collections as automated smoke and regression checks.
- Configure repeated runs and per-request RPS.
- Capture runner results and load-test metrics.

### DevOps and SRE teams

- Validate endpoint health after deployments.
- Run short duration-based load tests from the UI.
- Export load-test summaries for review.

## Product principles

1. **Local-first:** User data should remain under user control.
2. **Fast feedback:** Request execution and runner results should be visible immediately.
3. **Portable collections:** Collections, environments, and data files should be easy to move between machines.
4. **Secure secrets:** Secrets must be encrypted and never exposed casually in logs or UI lists.
5. **Progressive automation:** The product starts as an API client and grows into runner, load-test, and CI-friendly workflows.

## Functional requirements

### Core request engine

- Support HTTP methods, headers, query parameters, body types, and response rendering.
- Support GraphQL requests with query, variables, and operation name.
- Support JSON-RPC requests with JSON body content and an RPC indicator.
- Support WebSocket connections with live frame inspection.
- Support shell commands through a `SHELL` request method.
- Substitute variables from collection, environment, request, and secret sources.
- Preserve request history with response metadata.

### Authentication

- Support bearer, basic, API key, NTLM-style headers, OAuth2 token fields, and inherited collection auth.
- Keep secret-backed auth values encrypted until the secrets vault is unlocked.

### Environments and variables

- Support multiple environments.
- Support collection, environment, request, and secret variables.
- Allow active environment selection from the request editor.
- Support variable substitution in URLs, headers, bodies, auth fields, and scripts.

### Collections

- Create, rename, duplicate, copy, paste, and delete collections.
- Create folders and nested request structures.
- Add HTTP, GraphQL, JSON-RPC, WebSocket, and shell requests from context menus.
- Persist collections locally and support file-based collection workflows.

### Runner

- Create run configurations for a selected collection.
- Select requests to execute.
- Configure per-request RPS.
- Support duration-based repeated runs.
- Stop active runs.
- Display live results and request metadata.
- Persist completed load-test runs for later review.

### Load testing and stats

- Record request status, latency, timestamp, method, URL, and error state.
- Maintain live Stats metrics during an active run.
- Persist completed runs to disk.
- Show completed runs in the Stats panel.
- Render request volume, error volume, and response-time charts.
- Export completed run data as JSON or CSV.
- Delete individual or all completed runs.

### Secrets

- Store secret values encrypted in local storage.
- Display only secret names in list views.
- Use environment context when resolving secrets.
- Avoid exposing secret values in logs, history, or collection exports.

## Non-functional requirements

- The app must build for macOS, Windows, and Linux through Electron Forge.
- Renderer/main/preload code must build with Vite.
- Main-process privileged APIs must remain isolated from the renderer.
- Large load-test runs must avoid unbounded renderer memory growth.
- UI interactions should use stable selectors and accessible controls for testability.
- Tests should prefer local mocks and deterministic behavior over external network dependencies.

## Current implementation status

### Implemented

- Electron + Vue 3 application shell.
- Local-first collections, requests, environments, secrets, and run configurations.
- HTTP, GraphQL, JSON-RPC, WebSocket, and shell request support.
- Variable substitution and auth handling.
- Collection runner UI with RPS and repeated-run configuration.
- Load-test persistence, Stats panel, charts, and JSON/CSV export.
- Playwright integration test suite.

### Partially implemented

- Test scripts: the UI and result area exist, but scripts are not fully executed.
- Data-driven runner execution: request datafile metadata is stored, but CSV/JSON row expansion is not fully implemented in the runner engine.
- CI/CD runner execution: the product has load-test persistence and export, but a dedicated command-line RunConfig runner is not yet implemented.
- OAuth: token exchange helpers exist, but full user-facing OAuth flows need completion.

### Not implemented

- gRPC support.
- Team collaboration.
- API monitoring and alerting.
- Built-in mock server creation from collections.
- OpenAPI/Swagger import and validation.
- Native GitHub/Jira integrations.
- Enterprise governance, audit logs, SSO, and compliance features.

## Roadmap

### Near term

1. Fix and stabilize test coverage for runner, Stats, and request execution.
2. Add a command-line runner for RunConfig zip files in CI.
3. Complete data-driven runner execution for CSV/JSON datafiles.
4. Finish test script execution and assertion reporting.
5. Improve load-test time-series percentiles and export detail.

### Medium term

1. Add OpenAPI import and documentation generation.
2. Add collection examples and reusable response templates.
3. Add CI-friendly exit codes, reports, and JUnit output.
4. Improve secrets UX and secret rotation workflows.

### Long term

1. Add team workspaces and sync.
2. Add API monitoring and alerting.
3. Add enterprise security and compliance features.
4. Add advanced integrations with issue trackers and API gateways.
