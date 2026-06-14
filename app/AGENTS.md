# Kilo Agents for Hailstorm Frontend

## Overview
This document provides guidance on using Kilo agents with the Hailstorm app application.

## Frontend Structure
- `/app/src/components` - Vue components
- `/app/src/views` - Page-level components
- `/app/src/stores` - Pinia state management
- `/app/src/router` - Vue Router configuration
- `/app/src/core` - Execution engine and business logic
- `/app/src/types` - TypeScript interfaces
- `/app/src/preload.ts` - IPC bridge
- `/app/src/main.ts` - Electron main process

## Available Agents

### General Agent
Use for complex, multi-step tasks that require research and execution.
Best for: Refactoring, feature implementation, bug fixes requiring multiple file changes.

### Explore Agent
Use for quickly exploring the codebase to find specific patterns or understand architecture.
Best for: Finding where specific functionality is implemented, understanding code structure.

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

### Routing
- Routing is configured in `app/src/router/index.ts`
- Use hash-based routing for Electron compatibility
- Lazy load views when appropriate

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