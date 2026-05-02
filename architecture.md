# Hailstorm Application Architecture

## Overview
Hailstorm is an Electron-based desktop application for API testing and development. The application follows a modular architecture separating UI concerns from core execution logic.

## High-Level Architecture

### 1. Main Process (Electron Main)
- Responsible for application lifecycle management
- Creates and manages BrowserWindow instances
- Handles inter-process communication (IPC) for core functionality
- Provides access to Node.js APIs and system resources

### 2. Renderer Process (Electron Renderer)
- Runs the Vue.js frontend application
- Manages user interface and user interactions
- Communicates with main process via IPC for privileged operations

### 3. Core Execution Engine
- Encapsulates all business logic for API testing functionality
- Handles HTTP/HTTPS requests
- Manages shell command execution
- Provides file import/export capabilities
- Exposed to renderer process via IPC bridge

### 4. Preload Script
- Securely exposes necessary APIs to renderer process
- Uses contextBridge for safe IPC exposure
- Defines interfaces for core functionality

## Component Structure

### Main Process Components
- `main.ts`: Application entry point, window management, IPC handler registration
- `core/executionEngine.ts`: Core business logic for HTTP requests, shell commands, file operations

### Renderer Process Components
- `src/App.vue`: Root application component
- `src/router/index.ts`: Vue Router configuration defining application routes
- `src/layouts/AppLayout.vue`: Main application layout with sidebar and content areas
- `src/views/`: Page-level components for different application sections
- `src/components/`: Reusable UI components
- `src/stores/`: Pinia state management modules
- `src/types/`: TypeScript type definitions
- `src/preload.ts`: IPC bridge exposing safe APIs to renderer

## Communication Flow

1. **UI Interaction**: User interacts with Vue components in renderer process
2. **IPC Request**: Components use exposed `window.api` methods to send IPC requests
3. **Main Process Handling**: IPC handlers in `main.ts` or `core/executionEngine.ts` process requests
4. **Business Logic**: Core execution engine performs requested operations
5. **Response**: Results sent back to renderer process via IPC
6. **UI Update**: Components update state and re-render based on response data

## Key Design Principles

1. **Separation of Concerns**: UI logic separated from business logic
2. **Security**: Preload script limits exposed APIs to only what's necessary
3. **Modularity**: Core functionality encapsulated in reusable modules
4. **Electron Best Practices**: Proper use of main/renderer process separation
5. **Type Safety**: Extensive use of TypeScript for compile-time safety

Refactor store into domain-specific modules
Implement secure script execution with VM2
Split large components and add error boundaries
Complete Playwright tests and add Vitest unit tests
Add input validation and improve performance for large responses