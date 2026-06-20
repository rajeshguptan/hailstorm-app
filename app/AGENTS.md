# Kilo Agents for Hailstorm Frontend

## Overview
This document provides guidance on using Kilo agents with the Hailstorm app application.

## Frontend Structure
- `/app/src/components` - Vue components
- `/app/src/views` - Page-level components
- `/app/src/stores` - Pinia state management
- `/app/src/router` - Router configuration
- `/app/src/core` - Execution engine and IPC handlers
- `/app/src/types` - TypeScript interfaces
- `/app/src/preload.ts` - IPC bridge
- `/app/src/main.ts` - Electron main process
- `/app/scripts/mock-server.js` - Local mock server for request-type testing

## Request Support
- HTTP requests use method, URL, headers, body, auth, variables, and scripts.
- GraphQL requests use POST, JSON body type `graphql`, query editor, variables, and operation name.
- JSON-RPC requests use `isJsonRpc`, POST, `Content-Type: application/json`, and a JSON-RPC 2.0 body.
- WebSocket requests use `isWebSocket` and the WebSocket execution path.
- Shell requests use method `SHELL` and the command in the URL field.

## Collection and Context Menu Patterns
- Collection and folder context menu actions are implemented in `components/ContextMenu.vue`.
- New request creation actions live in `stores/collections.ts`.
- Request tree badges are rendered by `components/TreeNode.vue`; add new badge logic there when adding request types.

## Mock Server
Run the local mock server from `app/` with:

```bash
npm run mock-server
```

The server listens on `http://127.0.0.1:4010` by default and includes endpoints for HTTP methods/status/delay/auth/body types, GraphQL, JSON-RPC, WebSocket echo/chat, OAuth token, and shell command examples.

## Settings and Electron
- Developer Tools are disabled by default in `main.ts`.
- The renderer setting is in `SettingsContent.vue` under Advanced > Developer Tools.
- Use the preload API methods `getDevToolsEnabled()` and `setDevToolsEnabled(enabled)` to toggle DevTools through IPC.

## Secrets
- The Secrets panel list should display only secret names.
- The Secrets detail environment dropdown must use `environmentsStore.environments`.
- Secret values remain encrypted in localStorage when saved.

## Stats
- The Stats panel run selector should fill available header width with `flex-1`.
- Response-time charts use progressive line animation via `progressiveLineAnimation` in `StatsPanel.vue`.

## Available Agents

### General Agent
Use for complex, multi-step tasks that require research and execution.
Best for: Refactoring, feature implementation, bug fixes requiring multiple file changes.

### Explore Agent
Use for quickly exploring the codebase to find specific patterns or understand architecture.
Best for: Finding where specific functionality is implemented, understanding test organization.

## Common Tasks for Frontend Development

### Exploring the Codebase
```
Task: Find all Vue components related to request building
Agent: explore
Prompt: "Find all Vue components in app/src/components related to request building"
```

### Making Changes
```
Task: Add a new feature to the request panel
Agent: general
Prompt: "Add support for GraphQL queries in the RequestPanel component"
```

### Debugging
```
Task: Fix an issue with environment variable substitution
Agent: general
Prompt: "Investigate and fix environment variable substitution not working in request URLs"
```

## Project-Specific Guidelines

### Component Development
- Components are in `app/src/components`
- Follow Vue 3 Composition API with `<script setup>`
- Use Tailwind CSS for styling
- Components should be reusable and focused

### State Management
- State management uses Pinia in `app/src/stores`
- Follow the existing store patterns
- Actions should be async when dealing with IPC
- Getters for computed values

### Core Logic
- Business logic is modularized in `app/src/core/`:
  - `executionEngine.ts` - Main entry point, re-exports from other modules
  - `loadTestingService.ts` - Load test data persistence and metrics
  - `requestExecutor.ts` - Core request execution with variable substitution
  - `httpClient.ts` - HTTP/HTTPS request handling with rate limiting
  - `authHandler.ts` - Authentication and variable substitution utilities
  - `ipcHandlers.ts` - IPC handlers organized by functionality
  - `httpExecutor.ts` - Token bucket rate limiting and utility functions
  - `runnerEngine.ts` - Load test orchestration
  - `runnerWorker.ts` - Worker thread for parallel execution
  - `workerThreadPool.ts` - Thread pool management
- IPC communication handled through preload script
- Main process in `app/src/main.ts`
- Keep UI logic separate from core execution logic

### Styling
- Styles use Tailwind CSS
- Follow existing utility class patterns
- Use dark mode variants appropriately
- Maintain consistent spacing and typography

## Validation
- Use `npm run mock-server` in `app/` to start local test endpoints.
- Use `npx vite build` in `app/` for renderer build validation.
- `npm run lint` currently fails because `.eslintrc.js` is loaded as an ES module under the package `"type": "module"` configuration.
