# Kilo Agents for Hailstorm Frontend

## Overview
This document provides guidance on using Kilo agents with the Hailstorm frontend application.

## Frontend Structure
- `/frontend/src/components` - Vue components
- `/frontend/src/views` - Page-level components
- `/frontend/src/stores` - Pinia state management
- `/frontend/src/router` - Vue Router configuration
- `/frontend/src/core` - Execution engine and business logic
- `/frontend/src/types` - TypeScript interfaces
- `/frontend/src/preload.ts` - IPC bridge
- `/frontend/src/main.ts` - Electron main process

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

### Component Development
- Components are in `frontend/src/components`
- Follow Vue 3 Composition API with `<script setup>`
- Use Tailwind CSS for styling
- Components should be reusable and focused

### State Management
- State management uses Pinia in `frontend/src/stores`
- Follow the existing store patterns
- Actions should be async when dealing with IPC
- Getters for computed values

### Routing
- Routing is configured in `frontend/src/router/index.ts`
- Use hash-based routing for Electron compatibility
- Lazy load views when appropriate

### Core Logic
- Business logic is separated in `frontend/src/core/executionEngine.ts`
- IPC communication handled through preload script
- Main process in `frontend/src/main.ts`
- Keep UI logic separate from core execution logic

### Styling
- Styles use Tailwind CSS
- Follow existing utility class patterns
- Use dark mode variants appropriately
- Maintain consistent spacing and typography

## Agent Usage Examples

### Example 1: Adding a New UI Component
```
Task: Create a new authentication helper panel
Agent: general
Prompt: "Create a new Vue component in frontend/src/components/auth/AuthHelper.vue that provides common auth token helpers"
```

### Example 2: Refactoring Component Logic
```
Task: Refactor request form validation to use a composable
Agent: general
Prompt: "Extract request form validation logic into a useRequestValidation composable"
```

### Example 3: Exploring State Management
```
Task: Understand how environment variables are stored and used
Agent: explore
Prompt: "Find where environment variables are defined and how they're used throughout the application"
```