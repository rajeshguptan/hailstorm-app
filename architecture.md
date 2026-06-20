# Hailstorm Application Architecture

## Overview

Hailstorm is a local-first Electron desktop application for API development, testing, automation, and load testing. It uses Vue 3 for the renderer UI, Pinia for state, a secure preload bridge for IPC, and Node.js/Electron main-process modules for privileged execution.

## Process model

### Electron main process

**Entry point:** `app/src/main.ts`

Responsibilities:

- Application lifecycle.
- BrowserWindow creation.
- IPC handler registration.
- File dialogs and external URL handling.
- OAuth callback handling.
- Access to Node.js APIs such as filesystem, child processes, and network requests.

### Renderer process

**Root:** `app/src/App.vue`

Responsibilities:

- Vue router and layout.
- Collection, request, history, secrets, runner, stats, console, docs, and settings views.
- User interactions and local UI state.
- Calls into privileged functionality through the preload `window.api` surface.

### Preload bridge

**File:** `app/src/preload.ts`

Responsibilities:

- Expose a typed, safe `window.api` object to the renderer.
- Forward renderer requests to `ipcMain` handlers.
- Keep Node/Electron APIs out of renderer code.

## Core modules

| Module | Purpose |
| --- | --- |
| `app/src/core/executionEngine.ts` | Re-exports execution entry points and initializes IPC handlers |
| `app/src/core/ipcHandlers.ts` | Main-process IPC handlers for requests, files, secrets, OAuth, and load testing |
| `app/src/core/requestExecutor.ts` | Request preparation, variable substitution, auth, dependency execution, shell execution, and response history |
| `app/src/core/httpClient.ts` | HTTP/HTTPS request handling and rate limiting |
| `app/src/core/httpExecutor.ts` | Token bucket rate limiting and request flattening utilities |
| `app/src/core/authHandler.ts` | Variable substitution and auth helpers |
| `app/src/core/runnerEngine.ts` | Runner and load-test orchestration |
| `app/src/core/loadTestingService.ts` | Persistent load-test run storage, metrics, time series, and exports |
| `app/src/core/runnerWorker.ts` | Lightweight worker-thread HTTP request helper |

## Renderer structure

| Area | Purpose |
| --- | --- |
| `app/src/views` | Page-level screens |
| `app/src/components` | Reusable UI components |
| `app/src/stores` | Pinia modules for collections, requests, environments, secrets, runner, load testing, UI, and app state |
| `app/src/router` | Application routes |
| `app/src/types` | Shared TypeScript interfaces |

## Communication flow

1. User interacts with a Vue component.
2. The component updates a Pinia store or calls a preload API method.
3. The preload bridge sends an IPC message to the main process.
4. The main-process handler runs privileged logic.
5. Results return through IPC.
6. The renderer updates state and re-renders.

## Data storage

Hailstorm is local-first.

- Collections, requests, environments, secrets, run configurations, and UI state are persisted from renderer stores.
- Load-test runs are persisted by `loadTestingService` in the app data directory.
- File-based collection storage is available through collection import/export and workspace file flows.

## Security principles

- Keep privileged APIs in the main process.
- Expose only required methods through `contextBridge`.
- Do not pass raw Node/Electron objects to the renderer.
- Do not log secrets.
- Keep secret values encrypted in local storage and only decrypt when the secrets vault is unlocked.
- Validate file paths and dialog inputs in main-process handlers.

## Development conventions

- Use Vue 3 Composition API with `<script setup lang="ts">`.
- Use Tailwind CSS for UI styling.
- Keep UI logic in components and stores.
- Keep execution logic in `app/src/core`.
- Use async store actions when calling IPC.
- Prefer small, focused changes that preserve the Electron/Vue boundary.

## Validation

Run from `app/`:

```bash
npm run dev       # Start Vite dev server for integration tests
npm run mock-server
npx vite build
npm run make
```

`npm run lint` is currently unreliable because `.eslintrc.js` is loaded as an ES module under the package `"type": "module"` setting.
