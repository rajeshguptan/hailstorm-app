# Hailstorm Frontend Agent Guide

## Overview

This guide is for agents working in the Hailstorm Electron + Vue 3 application. Keep changes local-first, type-safe, and aligned with the existing separation between renderer UI, Pinia stores, preload IPC, and Electron main-process execution.

## Project structure

| Path | Purpose |
| --- | --- |
| `app/src/components` | Reusable Vue 3 components |
| `app/src/views` | Page-level views |
| `app/src/router` | Vue Router configuration |
| `app/src/stores` | Pinia state modules |
| `app/src/core` | Request execution, IPC handlers, runner, load-test persistence |
| `app/src/types` | Shared TypeScript interfaces |
| `app/src/preload.ts` | Secure `contextBridge` IPC API |
| `app/src/main.ts` | Electron main process entry point |
| `mock-server/server.js` | Local mock server for integration tests (port 4010) |

## Request support

- **HTTP**: method, URL, query params, headers, body, auth, variables, scripts, history, and response display.
- **GraphQL**: stored as POST requests with `body.type === 'graphql'`, query editor, variables, and operation name support.
- **JSON-RPC**: stored as POST requests with `isJsonRpc`, JSON body content, and an RPC badge in the collection tree.
- **WebSocket**: requests use `isWebSocket` and route through the WebSocket execution path.
- **Shell**: requests use method `SHELL`; the URL field stores the command.

## Collection and context menu patterns

- Context menus are implemented in `components/ContextMenu.vue`.
- Request creation actions live in `stores/collections.ts`.
- Collection tree rendering and badges live in `components/TreeNode.vue`.
- When adding a new request type or badge, update both the collection action and the tree badge renderer.

## Settings and Electron

- Developer Tools are disabled by default in `main.ts`.
- The renderer setting is in `SettingsContent.vue` under Advanced > Developer Tools.
- Use the preload API methods `getDevToolsEnabled()` and `setDevToolsEnabled(enabled)` to toggle DevTools through IPC.

## Secrets

- The Secrets list should display only secret names.
- The Secrets detail environment dropdown must use `environmentsStore.environments`.
- Secret values remain encrypted in local storage when saved.
- Do not log secret values or expose them through renderer APIs.

## Runner and load testing

- Run configurations are stored in `stores/runner.ts`.
- Runner UI and request selection are implemented in `components/RunnerDetails.vue`.
- Load-test orchestration lives in `core/runnerEngine.ts`.
- Load-test persistence and metrics live in `core/loadTestingService.ts`.
- The Stats panel renders live and completed run data in `components/StatsPanel.vue`.

## Coding conventions

- Use Vue 3 Composition API with `<script setup lang="ts">`.
- Use Tailwind CSS for styling and follow existing utility-class patterns.
- Use Pinia stores for shared state.
- Keep IPC-facing actions async when they call `window.api`.
- Keep privileged Node/Electron APIs in the main process.
- Keep renderer UI logic in components/stores and business logic in `app/src/core`.
- Prefer small, focused changes over broad rewrites.

## Validation

Run commands from `app/` unless otherwise noted.

```bash
npm run mock-server
npx vite build
npm run make
```

Notes:

- `npm run dev` starts the Vite dev server used by Playwright integration tests.
- `npm run lint` is currently unreliable because `.eslintrc.js` is loaded as an ES module under the package `"type": "module"` setting.
