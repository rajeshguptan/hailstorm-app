# Hailstorm Agent Guide

## Project overview

Hailstorm is a local-first Electron + Vue 3 API client for API development, testing, automation, and load testing workflows. It supports HTTP, GraphQL, JSON-RPC, WebSocket, shell commands, environments, secrets, collection runners, and load-test reporting.

## Repository map

| Area | Path | Purpose |
| --- | --- | --- |
| App source | `app/src` | Renderer, Electron main process, preload bridge, stores, core execution |
| Electron main process | `app/src/main.ts` | Application lifecycle, BrowserWindow setup, IPC registration |
| Preload bridge | `app/src/preload.ts` | Secure `window.api` surface exposed to the renderer |
| Vue stores | `app/src/stores` | Pinia state for collections, requests, environments, secrets, runner, and load testing |
| Core execution | `app/src/core` | Request execution, IPC handlers, runner engine, load-test persistence |
| Types | `app/src/types` | Shared TypeScript interfaces |
| Integration tests | `e2e/tests` | Playwright tests and page objects |
| Mock server | `mock-server/server.js` | Local HTTP, WebSocket, GraphQL, JSON-RPC, auth, users, rate-limiting, and file-upload endpoints |

## Current feature notes

- Request types: HTTP, GraphQL, JSON-RPC, WebSocket, and shell.
- Collection/folder context menus support add, duplicate, copy, paste, rename, delete, and request-type-specific creation.
- JSON-RPC requests are stored as POST requests with `isJsonRpc`, JSON body content, and an RPC badge in the collection tree.
- WebSocket requests use `isWebSocket` and route through the WebSocket execution path.
- Shell requests use method `SHELL`, with the command stored in the URL field.
- Environments provide variable substitution for collection, request, environment, and secret values.
- Secrets list items show only secret names. The Secrets detail environment dropdown is populated from `environmentsStore`.
- The Runner supports run configurations, selected requests, per-request RPS, repeated duration-based runs, and request datafile metadata.
- Stats stores live metrics in a rolling window and persists completed load-test runs to local files.
- Stats response-time charts use progressive Chart.js line animation.

## Development and validation commands

Useful commands:

- `npm run mock-server` starts the local test server on `127.0.0.1:4010`.
- `npm run dev` starts the Vite dev server for renderer integration tests.
- `npx vite build` validates the Vite renderer/main/preload build.
- `npm run make` runs Electron Forge packaging.
- `npm run lint` is currently unreliable because `.eslintrc.js` is loaded as an ES module under the package `"type": "module"` setting.

## Agent guidance
- Refer to the AGENTS.md file in each subfolder. 
- Prefer small, targeted changes that preserve the existing Electron/Vue architecture.
- Add or update tests when changing request execution, collection behavior, runner behavior, secrets, environments, or stats.
- After every change, check if AGENTS.md needs updating.

## Accessibility (ADA/WCAG Compliance)

The application follows these accessibility standards:

### Implemented Features
- **Skip links**: Main layout includes a "Skip to main content" link for keyboard users
- **ARIA landmarks**: Navigation, main content, and regions properly labeled
- **Screen reader utilities**: `.sr-only` class for visually hidden content
- **Focus management**: Visible focus indicators on all interactive elements
- **Keyboard navigation**: Collection tree supports arrow keys and Enter/Space for interaction
- **Modal dialogs**: Rename modal has proper `aria-modal` and focus management
- **Context menus**: `role="menu"` with `menuitem` roles and keyboard support
- **Tables**: Proper `scope="col"` attributes for stat and runner tables
- **Tabs**: Request and Response panels have proper `role="tablist"` and `role="tab"` attributes
- **Reduced motion**: Respects `prefers-reduced-motion` media query
- **High contrast**: Supports `prefers-contrast: high` mode

### Files Modified
- `index.html`: Added `lang="en"` and viewport meta tag
- `src/index.css`: Added skip link, focus styles, reduced motion, high contrast support
- `src/layouts/AppLayout.vue`: Skip link, navigation ARIA roles
- `src/components/collection/RequestTree.vue`: Tree role, keyboard navigation
- `src/components/collection/TreeNode.vue`: Treeitem roles, keyboard handlers
- `src/components/base/ContextMenu.vue`: Menu roles, keyboard support
- `src/components/base/RenameModal.vue`: Modal ARIA attributes, focus management
- `src/components/request/RequestPanel.vue`: Tablist roles, ARIA labels
- `src/components/request/ResponsePanel.vue`: Tablist roles, ARIA labels
- `src/composables/useAccessibility.ts`: Focus trap and announcer utilities