# Hailstorm Application Features & Functionality

## Overview
Hailstorm is a developer-centric API testing platform built with Electron and Vue.js. This document describes the current features and detailed UI specifications that can be used as requirements for a rewrite.

## Application Layout

### Main Window
- **Type**: Electron BrowserWindow
- **Default State**: Maximized on primary display
- **Minimum Size**: 800x600 pixels
- **Developer Tools**: Automatically opened on startup
- **Theme Support**: Dark mode with Tailwind CSS classes

### Layout Structure
The application uses a three-pane layout:
1. **Left Sidebar** (collapsible): Navigation between different sections
2. **Main Content Area**: Displays selected view content
3. **Bottom Panel** (in request views): Response viewer and testing results

## Detailed Feature Specifications

### 1. Request Building Interface

#### URL Bar Component
- **Location**: Top of request panel
- **Components**:
  - HTTP Method Dropdown: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
  - URL Input Field: Text input with Enter key submission
  - Send Button: Primary action button showing "Sending..." state during requests
  - Save Button: Secondary action to persist current request
- **Styling**: 
  - Light/Dark mode aware backgrounds and borders
  - Flexbox layout with gap spacing
  - Method select: Fixed width (100px)
  - URL input: Flexible width (flex-1)
  - Buttons: Secondary styling with hover effects

#### Request Metadata
- **Request Name Field**: Text input for naming requests
- **Validation**: Required field for saving requests

#### Request Configuration Tabs
Located below URL bar with tabbed interface:

##### Parameters Tab
- **Purpose**: Manage URL query parameters
- **Interface**:
  - Key/Value table with two columns
  - Each row: Key input, Value input, Remove button (×)
  - "Add Parameter" button to append new rows
  - Live URL updating as parameters change
  - Parameter enabled/disabled toggle (via checkbox in Variable interface)

##### Headers Tab
- **Purpose**: Manage HTTP request headers
- **Interface**:
  - Key/Value table similar to parameters
  - Each row: Key input, Value input, Remove button (×)
  - "Add Header" button to append new rows
  - Header enabled/disabled toggle

##### Body Tab
- **Purpose**: Define request body content
- **Interface**:
  - Body type radio buttons: None, JSON, Text
  - Textarea for body content (5 rows)
  - JSON type automatically sets Content-Type header
  - Disabled textarea when body type is "None"
  - Placeholder text showing JSON example

##### Scripts Tab
- **Purpose**: Add JavaScript execution before/after requests
- **Interface**:
  - Pre-request Script textarea (3 rows, monospace font)
  - Test Script textarea (3 rows, monospace font)
  - Placeholder comments indicating execution timing
  - Syntax highlighting would be ideal but not currently implemented

### 2. Response Viewer Component

#### Response Status Bar
- **Location**: Top of response panel
- **Components**:
  - Status Code/Text Display: Green for 2xx, Red for other statuses
  - Response Time Display: Shows milliseconds in smaller text
  - "Ready to send request" placeholder when no response

#### Response Tabs
Tabbed interface for different response views:

##### Body Tab
- **Purpose**: Display response content
- **Features**:
  - Automatic JSON formatting with syntax highlighting (2-space indentation)
  - Fallback to plain text for non-JSON responses
  - Monospace font, whitespace-pre-wrap formatting
  - Scrollable container with overflow handling

##### Headers Tab
- **Purpose**: Display response headers
- **Features**:
  - Key: Value format, one per line
  - Proper handling of multi-value headers (comma-separated)
  - Monospace font, whitespace-pre-wrap formatting

##### Tests Tab
- **Purpose**: Display test execution results
- **Features**:
  - Shows test results text
  - Currently placeholder for future test framework integration

### 3. Sidebar Navigation

#### Collections Panel
- **Purpose**: Manage API request collections
- **Features**:
  - List of collections with names
  - Add new collection button (+)
  - Context menu for each collection (right-click):
    - Rename
    - Delete
    - New Request
    - New Folder
  - Drag-and-drop reordering (via external library)
  - Expand/collapse collections to show requests and folders

#### Environments Panel
- **Purpose**: Manage environment variables
- **Features**:
  - List of environments with names and active indicators
  - Import environments button (supports JSON format)
  - Add new environment button (+)
  - Environment selection (radio button style)
  - Context menu for each environment:
    - Select as Active
    - Edit
    - Duplicate
    - Delete
  - Edit environment modal:
    - Name field
    - Variables table (Key/Value with enabled toggle)
    - Active checkbox
    - Save/Cancel buttons

#### History Panel
- **Purpose**: Track request history
- **Features**:
  - List of historical requests with:
    - Method badge
    - URL (truncated if long)
    - Status code
    - Response time
  - Context menu for each history item:
    - Send Again
    - Save as Request
    - Copy URL
    - Copy as cURL
  - Clear history option

#### Secrets Panel
- **Purpose**: Manage sensitive data (API keys, tokens)
- **Features**:
  - List of secrets with names (values masked)
  - Add new secret button (+)
  - Secret selection for use in requests
  - Context menu for each secret:
    - Use in Request
    - Edit
    - Delete
  - Edit secret modal:
    - Name field
    - Value field (password type)
    - Description field
    - Save/Cancel buttons

#### Utilities Panel
- **Purpose**: Provide utility functions
- **Features**:
  - Response time calculator
  - Header encoder/decoder
  - JSON formatter/validator
  - JWT decoder
  - Base64 encoder/decucer
  - Timestamp converter
  - Each utility as a card with input/output fields

#### RunConfigs Panel
- **Purpose**: Configure and execute test runs
- **Features**:
  - Collection selection dropdown
  - Environment selection dropdown
  - Iteration count input
  - Delay between requests input
  - Data file upload (CSV/JSON for data-driven testing)
  - Run/Stop buttons
  - Progress tracking

#### Runner Panel
- **Purpose**: Display test execution results
- **Features**:
  - Test execution statistics (total, passed, failed, average time)
  - Detailed test results list
  - Failed test filtering
  - Export results option

### 4. Views (Page-Level Components)

#### Collections View
- **Purpose**: Main interface for building and organizing requests
- **Layout**: Sidebar (CollectionsPanel) + Main Content (Request Builder + Response Viewer)

#### Environments View
- **Purpose**: Dedicated interface for environment management
- **Layout**: Sidebar (EnvironmentsPanel) + Main Content (Environment editor/form)

#### History View
- **Purpose**: Dedicated interface for request history
- **Layout**: Sidebar (HistoryPanel) + Main Content (History list with details)

#### Secrets View
- **Purpose**: Dedicated interface for secret management
- **Layout**: Sidebar (SecretsPanel) + Main Content (Secret editor/form)

#### Stats View
- **Purpose**: Display application statistics and telemetry
- **Layout**: Sidebar (empty or minimal) + Main Content (Statistics panels)
- **Features**:
  - Request statistics (total, success rate, average time)
  - Status code distribution
  - Response time charts (would need charting library)
  - Memory usage (Electron-specific)

#### Settings View
- **Purpose**: Configure application preferences
- **Layout**: Sidebar (SettingsPanel) + Main Content (Settings form)
- **Features**:
  - General settings:
    - Theme selection (Light/Dark/System)
    - Request timeout
    - Follow redirects
    - SSL certificate validation
  - Proxy settings:
    - Host, port, username, password
    - Bypass list
  - Editor settings:
    - Font size
    - Tab size
    - Enable syntax highlighting
  - Advanced settings:
    - Local storage location
    - Auto-save interval
    - Log level

#### Utilities View
- **Purpose**: Access utility tools
- **Layout**: Sidebar (UtilitiesPanel) + Main Content (Selected utility tool)

#### Console View
- **Purpose**: Display application logs and debugging information
- **Layout**: Sidebar (empty) + Main Content (Log console)
- **Features**:
  - Log levels (Error, Warn, Info, Debug)
  - Filter by level
  - Search/filter logs
  - Clear console
  - Export logs

### 5. Core Functionality

#### HTTP Request Engine
- **Protocols**: HTTP/1.1, HTTPS (HTTP/2 planned)
- **Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Features**:
  - Custom headers
  - Query parameters
  - Request body (none, JSON, text)
  - Authentication (basic, bearer token, API key - via headers)
  - Variable substitution ({{variableName}} syntax)
  - Pre-request script execution (isolated VM)
  - Test script execution (isolated VM)
  - Response time measurement
  - Error handling and reporting

#### Variable System
- **Scopes**:
  - Global Variables: Persistent across sessions
  - Environment Variables: Active environment only
  - Local Variables: Request-specific (URL params, headers)
- **Syntax**: `{{variableName}}` for substitution
- **Resolution Order**: Local → Environment → Global
- **UI Management**: Through Environments panel and request parameter/header editors

#### Scripting Engine
- **Technology**: Isolated Node.js VM (vm2 module or similar planned)
- **Pre-request Scripts**:
  - Execute before request is sent
  - Can modify request parameters, headers, body
  - Access to pm-like object for variable setting
  - Sandboxed for security
- **Test Scripts**:
  - Execute after response is received
  - Access to response data (status, headers, body)
  - Assertion library (Chai-like or custom)
  - Ability to set test results for reporting

#### Collection Runner
- **Purpose**: Execute multiple requests in sequence
- **Features**:
  - Select collection to run
  - Choose environment
  - Set delay between requests
  - Data-driven testing with CSV/JSON files
  - Progress tracking during execution
  - Results summary with pass/fail counts

#### Load Runner
- **Purpose**: Performance/load testing
- **Features**:
  - Configure concurrent users/virtual users
  - Set test duration or iteration count
  - Ramp-up period configuration
  - Real-time metrics display:
    - Requests per second (RPS)
    - Response times (min, max, average, p95, p99)
    - Error rates
    - Throughput
  - Concurrent execution using worker threads
  - Stop test functionality

#### File Import/Export
- **Import**:
  - Hailstorm JSON format (collections, environments, history)
  - Postman collections (v2.1)
  - OpenAPI/Swagger specifications
  - cURL commands
- **Export**:
  - Hailstorm JSON format
  - Markdown documentation (one-click)
  - Environment variables as JSON/env files
  - Test results as JSON/XML/HTML

#### Telemetry & Monitoring
- **Real-time Metrics**:
  - Latency charts (response time over time)
  - Throughput (requests/sec)
  - Error rates
  - Status code distribution
- **Historical Data**:
  - Session statistics
  - Trend analysis (would require persistent metrics storage)
  - Comparison between runs

### 6. User Experience Features

#### Keyboard Shortcuts
- **Ctrl+N / Cmd+N**: New request
- **Ctrl+O / Cmd+O**: Open collection
- **Ctrl+S / Cmd+S**: Save request
- **Ctrl+Enter / Cmd+Enter**: Send request
- **Ctrl+L / Cmd+L**: Focus URL bar
- **Ctrl+F / Cmd+F**: Search in current view
- **Ctrl+Z / Cmd+Z**: Undo (where applicable)
- **Ctrl+Y / Cmd+Y**: Redo (where applicable)
- **Delete**: Delete selected item (in lists)

#### Theme System
- **Dark Mode**: Default theme with high contrast
- **Light Mode**: Alternative theme
- **System Theme**: Follows OS settings
- **Implementation**: Tailwind CSS dark mode variants
- **Persistence**: User preference saved to localStorage

#### Layout Persistence
- **Splitter Positions**: Remember pane sizes between sessions
- **Sidebar State**: Remember collapsed/expanded state
- **Tab State**: Remember open tabs and active tab
- **Window State**: Remember window size/position (not maximized)

#### Context Menus
- **Usage**: Right-click on various elements for actions
- **Implementation**: Vue-based custom context menu
- **Positioning**: Appears at mouse coordinates
- **Auto-hide**: Closes when clicking outside menu

#### Notification System
- **Types**: Success, error, warning, info
- **Display**: Toast notifications in corner
- **Duration**: Auto-dismiss after timeout
- **Action Buttons**: Undo/retry options where applicable
- **Persistence**: Important errors remain until dismissed

### 7. Data Management

#### Local Storage
- **Technology**: browser localStorage (via Electron's renderer process)
- **Data Stored**:
  - Collections (requests, folders, variables)
  - Environments (variables, active state)
  - Request history (limited to 100 entries)
  - Application settings
  - UI state (splitter positions, tab states, etc.)
- **Backup/Export**: Manual export functionality
- **Import**: Overwrite or merge options

#### Data Format
- **Collections**: Hierarchical structure with requests and folders
- **Requests**: Method, URL, headers, body, scripts, variables
- **Environments**: Key-value pairs with active flag
- **History**: Request metadata with timestamp and response data
- **Secrets**: Encrypted storage planned (currently plain text)

### 8. Security Features

#### Script Sandboxing
- **Pre/test Scripts**: Execute in isolated VM context
- **Restricted Access**: No filesystem or network access
- **Allowed Objects**: Limited API for variable manipulation
- **Timeout Protection**: Prevent infinite loops

#### Secret Management
- **Masking**: Values hidden in UI display
- **Memory Only**: Planned enhancement to avoid disk storage
- **Environment Integration**: Reference secrets in requests/environments

#### Request Safety
- **URL Validation**: Prevent malformed or dangerous URLs
- **Size Limits**: Request/response size limitations
- **Timeout Configurable**: Prevent hanging requests

## Technical Implementation Details

### Frontend Stack
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia
- **Routing**: Vue Router (hash-based)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite with Electron Forge
- **Language**: TypeScript

### Electron Architecture
- **Main Process**: 
  - Node.js environment
  - Application lifecycle management
  - BrowserWindow creation
  - IPC handlers for privileged operations
- **Preload Script**:
  - ContextBridge for secure IPC exposure
  - Type-safe API exposure to renderer
- **Renderer Process**:
  - Vue.js application
  - DOM access and manipulation
  - LocalStorage usage
  - IPC renderer for main process communication

### Communication Pattern
1. **Renderer → Main**: 
   - Through `window.api` exposed via preload
   - IPC renderer.invoke() calls
   - Typed requests/responses
2. **Main → Renderer**:
   - IPC handlers return results
   - Automatic promise resolution
   - Error propagation through rejected promises

### Code Organization
- **src/**
  - **components/**: Reusable UI widgets
  - **views/**: Page-level components
  - **stores/**: Pinia state management
  - **types/**: TypeScript interfaces
  - **router/**: Vue Router configuration
  - **core/**: Execution engine (separated from UI)
  - **preload.ts**: IPC bridge
  - **main.ts**: Electron main process entry
  - **App.vue**: Root component
  - **index.css**: Global styles

## Requirements for Rewrite

Based on the current implementation, a rewrite should preserve:

### Functional Requirements
1. All existing request building capabilities
2. Full response viewing and formatting
3. Collection organization and management
4. Environment and variable substitution
5. Pre-request and test scripting
6. Collection runner and load runner functionality
7. Import/export capabilities
8. Theme system (dark/light)
9. Keyboard shortcuts
10. Context menus
11. Local persistence
12. Telemetry and metrics display

### Non-Functional Requirements
1. Electron-based desktop application
2. Vue.js frontend framework
3. TypeScript for type safety
4. Tailwind CSS for styling
5. Modular architecture separating UI from core logic
6. Secure IPC communication
7. Local-first data storage
8. Sandboxed script execution
9. Responsive UI that adapts to window size
10. Accessibility considerations (focus management, ARIA labels)

### Technical Constraints to Maintain
1. Maximum compatibility with existing data formats
2. Preserve keyboard shortcut muscle memory
3. Maintain similar UI workflow and terminology
4. Keep essential advanced features ( scripting, variables, runners )
5. Support for HTTP/1.1 and HTTPS (HTTP/2 as enhancement)
6. Local storage as primary persistence mechanism