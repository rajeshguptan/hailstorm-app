# Postman Features vs Hailstorm Implementation Status

This document compares major Postman capabilities with the current Hailstorm implementation. It is intended as a product planning reference, not a marketing claim.

## Legend

| Status | Meaning |
| --- | --- |
| Implemented | Feature is complete or functionally available in the current codebase. |
| Partial | Basic implementation exists, but important behavior is incomplete. |
| Not implemented | Feature is not currently available. |
| Needs review | Status depends on deeper validation or product clarification. |

## 1. Core API client features

### Request building and sending

| Feature | Status | Notes |
| --- | --- | --- |
| HTTP methods | Implemented | GET, POST, PUT, PATCH, DELETE, and shell method support. |
| URL and query parameters | Implemented | Headers, URL, and query parameters are editable. |
| Request headers | Implemented | Enabled/disabled header variables are supported. |
| Request body types | Implemented | None, form data, URL encoded, raw, binary, JSON, XML, text, and GraphQL payloads. |
| File upload support | Partial | Binary body type exists; full file-picker UX should be validated. |
| Response viewer | Implemented | Status, headers, body, time, and errors are displayed. |
| Response formatting | Implemented | JSON and text response bodies are rendered. |

### Authentication and authorization

| Feature | Status | Notes |
| --- | --- | --- |
| Bearer token | Implemented | Header substitution is supported. |
| Basic authentication | Implemented | Username and password substitution is supported. |
| API key authentication | Implemented | Header and query API keys are supported. |
| OAuth 2.0 | Partial | Token exchange helpers and OAuth2 fields exist; full user-facing flow needs completion. |
| OAuth 1.0 | Not implemented | No current implementation. |
| Digest authentication | Not implemented | No current implementation. |
| NTLM authentication | Partial | Header generation exists; full NTLM challenge handling is not implemented. |
| AWS Signature | Not implemented | No current implementation. |
| Hawk authentication | Not implemented | No current implementation. |

### Advanced request types

| Feature | Status | Notes |
| --- | --- | --- |
| GraphQL | Implemented | GraphQL body type, query, variables, and operation name support. |
| JSON-RPC | Implemented | Stored as POST JSON requests with `isJsonRpc` and RPC badge. |
| WebSocket | Implemented | WebSocket requests use `isWebSocket` and route through WebSocket execution. |
| Shell commands | Implemented | `SHELL` method executes local commands from the URL/command field. |
| gRPC | Not implemented | No current implementation. |
| Socket.IO | Not implemented | No current implementation. |
| MQTT | Not implemented | No current implementation. |
| SOAP | Not implemented | No dedicated SOAP tooling. |
| Unix domain sockets | Not implemented | No current implementation. |

## 2. Organization and collections

| Feature | Status | Notes |
| --- | --- | --- |
| Create/edit collections | Implemented | Local-first collection state. |
| Nested folders | Implemented | Collection items support nested folders. |
| Import/export JSON collections | Implemented | File-based collection workflows exist. |
| Collection runner | Implemented | Basic run configuration and execution exists. |
| Collection examples | Not implemented | No saved examples feature. |
| Collection versioning | Not implemented | No version history. |
| Git integration | Partial | File-based storage is git-friendly, but native Git workflows are not implemented. |

## 3. Variables and environments

| Feature | Status | Notes |
| --- | --- | --- |
| Multiple environments | Implemented | Environment selection exists. |
| Environment variables | Implemented | Variable substitution is supported. |
| Collection variables | Implemented | Collections can store variables. |
| Request variables | Implemented | Requests can store variables. |
| Secret variables | Implemented | Secrets are stored encrypted and resolved when unlocked. |
| Data variables from CSV/JSON | Partial | Datafile metadata exists in runner config, but row expansion is not fully implemented. |

## 4. Testing and automation

| Feature | Status | Notes |
| --- | --- | --- |
| Pre-request scripts | Partial | Script execution exists in some paths, but runtime safety and consistency need improvement. |
| Test scripts | Partial | UI and result area exist, but scripts are not fully executed. |
| Assertion library | Partial | Basic assertion concepts exist; full assertion reporting is incomplete. |
| Test results display | Implemented | Response panel has a tests tab/result area. |
| Collection runner | Implemented | Runner supports selected requests and repeated duration-based runs. |
| Data-driven testing | Partial | Request datafile metadata is stored; full CSV/JSON iteration is pending. |
| CI/CD integration | Not implemented | Command-line RunConfig execution is planned but not implemented. |
| Newman CLI | Not implemented | No Newman-compatible CLI. |

## 5. Load testing and performance

| Feature | Status | Notes |
| --- | --- | --- |
| Load testing engine | Implemented | Runner can execute requests repeatedly with RPS controls. |
| Rate limiting | Implemented | Token bucket rate limiting is used for request execution. |
| Real-time metrics | Implemented | Live Stats updates during active runs. |
| Response time analysis | Partial | Charts display response-time data; persisted percentile calculations need completion. |
| Concurrent users simulation | Partial | Runner can execute selected requests and RPS-based repeated runs; true parallel concurrency needs review. |
| Duration-based testing | Implemented | Repeated runs support duration in seconds. |
| Results export | Implemented | Completed runs can be exported as JSON or CSV. |

## 6. Mocking and simulation

| Feature | Status | Notes |
| --- | --- | --- |
| Mock server creation | Not implemented | The app has a local test server, but users cannot create mock servers from collections. |
| Dynamic responses | Not implemented | No collection-driven mock response engine. |
| Mock collections | Needs review | Separate `mock-server/` assets exist, but they are not integrated into the app. |
| Saved examples | Not implemented | No examples feature. |
| Example matching | Not implemented | No example matching feature. |

## 7. Monitoring and health checks

| Feature | Status | Notes |
| --- | --- | --- |
| Scheduled monitors | Not implemented | No scheduler. |
| Uptime monitoring | Not implemented | No monitoring service. |
| Performance monitoring | Partial | Load-test runs provide performance data, but not ongoing monitoring. |
| Alerting | Not implemented | No alerts. |
| Automated health tests | Partial | Runner can execute requests, but no health-check workflow exists. |
| Status page integration | Not implemented | No integration. |

## 8. Documentation and specifications

| Feature | Status | Notes |
| --- | --- | --- |
| Auto-generated documentation | Not implemented | No documentation generator. |
| Markdown export | Partial | Docs describe manual/export workflows; generator is not implemented. |
| Interactive documentation | Not implemented | No interactive docs UI. |
| OpenAPI/Swagger import | Not implemented | No importer. |
| Spec validation | Not implemented | No schema validation. |
| API design tools | Not implemented | No design surface. |

## 9. Collaboration and team features

| Feature | Status | Notes |
| --- | --- | --- |
| Shared workspaces | Not implemented | Local-first single-user focus. |
| Team roles and permissions | Not implemented | No team model. |
| Comments and discussions | Not implemented | No collaboration layer. |
| Real-time collaboration | Not implemented | No sync layer. |
| Public API publishing | Not implemented | No publishing workflow. |

## 10. Integrations and enterprise features

| Feature | Status | Notes |
| --- | --- | --- |
| Issue tracker integrations | Not implemented | No Jira/GitHub integration. |
| API gateways | Not implemented | No gateway integration. |
| Version control integrations | Partial | File-based storage is git-friendly, but native integrations are not implemented. |
| API governance | Not implemented | No governance layer. |
| Security policies | Not implemented | No policy engine. |
| Audit logs | Not implemented | No audit log system. |
| SSO integration | Not implemented | No SSO. |
| Private APIs | Not implemented | No private API registry. |
| Data residency | Not implemented | Local-first storage, but no enterprise controls. |
| GDPR compliance tooling | Not implemented | No compliance tooling. |

## 11. User experience and interface

| Feature | Status | Notes |
| --- | --- | --- |
| Tabbed interface | Implemented | Request tabs and sidebar navigation exist. |
| Dark mode | Implemented | Tailwind dark mode is used. |
| Keyboard shortcuts | Needs review | Existing shortcuts should be audited. |
| Drag and drop | Needs review | Existing behavior should be validated. |
| Search and filter | Needs review | Existing search/filter behavior should be validated. |
| Request history | Implemented | History entries are stored and displayed. |
| Auto-save | Implemented | Local-first stores persist state. |
| Offline mode | Implemented | App is designed for local-first usage. |

## Summary

Hailstorm is strongest as a local-first API client with collection execution, environment-aware requests, secrets, and load-test reporting. The highest-value gaps are:

- Command-line runner for CI/CD.
- Complete data-driven runner execution.
- Full test script execution and assertions.
- OpenAPI import and documentation generation.
- More complete load-test percentile reporting.
- Safer script runtime hardening.
- Native Git, monitoring, collaboration, and enterprise integrations.
