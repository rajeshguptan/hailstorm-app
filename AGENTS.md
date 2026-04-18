# Kilo Agents for Hailstorm Project

## Overview
This document provides guidance on using Kilo agents with the Hailstorm API testing platform project.

## Project Structure
- `/` - Root project directory
- `/frontend` - Electron/Vue.js application
- `/integration-tests` - Playwright integration tests

## Available Agents

### General Agent
Use for complex, multi-step tasks that require research and execution.
Best for: Refactoring, feature implementation, bug fixes requiring multiple file changes.

### Explore Agent
Use for quickly exploring the codebase to find specific patterns or understand architecture.
Best for: Finding where specific functionality is implemented, understanding code structure.

## Common Tasks for Hailstorm Project

### Exploring the Codebase
```
Task: Find all Vue components related to request building
Agent: explore
Prompt: "Find all Vue components in frontend/src/components related to request building"
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

### Frontend Development
- Components are in `frontend/src/components`
- Views (pages) are in `frontend/src/views`
- State management uses Pinia in `frontend/src/stores`
- Routing is configured in `frontend/src/router/index.ts`
- Styles use Tailwind CSS

### Execution Engine
- Core logic is separated in `frontend/src/core/executionEngine.ts`
- IPC communication handled through preload script
- Main process in `frontend/src/main.ts`

### Testing
- Integration tests in `integration-tests/tests/` using Playwright
- Test configuration in `integration-tests/playwright.config.ts`

## Agent Usage Examples

### Example 1: Adding a New UI Component
```
Task: Create a new authentication helper panel
Agent: general
Prompt: "Create a new Vue component in frontend/src/components/auth/AuthHelper.vue that provides common auth token helpers"
```

### Example 2: Refactoring Core Logic
```
Task: Refactor HTTP request handling to use a service class
Agent: general
Prompt: "Refactor the makeHttpRequest function in frontend/src/core/executionEngine.ts to use a dedicated HTTPService class"
```

### Example 3: Exploring API Structure
```
Task: Understand how collections are structured
Agent: explore
Prompt: "Find where collection data structures are defined and how they're used throughout the application"
```