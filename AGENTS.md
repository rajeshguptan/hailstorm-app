# Hailstorm Agent Guide

## Project
Hailstorm is an Electron + Vue 3 API client for HTTP, GraphQL, JSON-RPC, WebSocket, shell, secrets, environments, and load testing workflows.

## Agent Entry Points
- Frontend app code lives in `app/src`.
- Electron main process is `app/src/main.ts`.
- Renderer preload bridge is `app/src/preload.ts`.
- Pinia stores live in `app/src/stores`.
- Core execution and IPC handlers live in `app/src/core`.
- E2E tests live in `e2e/tests`.

## Current Feature Notes
- Request types include HTTP, GraphQL, JSON-RPC, WebSocket, and shell commands.
- Collection/folder context menus support adding HTTP, JSON-RPC, GraphQL, WebSocket, shell requests, folders, copy, paste, duplicate, rename, and delete.
- JSON-RPC requests use `Request.isJsonRpc`, a POST method, JSON body, and an RPC badge in the collection tree.
- A local mock server is available with `npm run mock-server` from `app/`; it uses Express, ws, and multer.
- Developer Tools are disabled by default and can be enabled from Settings > Advanced > Developer Tools.
- Secrets list items show only secret names; the Secrets detail environment dropdown is populated from `environmentsStore`.
- Stats response-time charts use progressive Chart.js line animation.

## Validation
- Use `npm run mock-server` in `app/` to start local test endpoints.
- Use `npx vite build` in `app/` for renderer build validation.
- `npm run lint` currently fails because `.eslintrc.js` is loaded as an ES module under the package `"type": "module"` configuration.
