# Hailstorm: API Development Desktop App

A local-first Electron application for API development, testing, automation, and load testing. Built with Vue 3, Pinia, and Tailwind CSS.

## System Architecture

```mermaid
graph TB
    subgraph "Electron Framework"
        subgraph "Main Process"
            MP[main.ts]
            IPC[IPC Handlers]
            CORE[Core Modules]
        end

        subgraph "Preload Bridge"
            PB[preload.ts]
        end

        subgraph "Renderer Process"
            APP[App.vue]
            ROUTER[Vue Router]
            STORES[Pinia Stores]
            VIEWS[Views]
            COMPS[Components]
        end
    end

    subgraph "External"
        API[HTTP/GraphQL/JSON-RPC APIs]
        WS[WebSocket APIs]
        QUERY[Query Requests]
    end

    MP <-- IPC --> PB
    PB <-- contextBridge --> RENDERER[Renderer]
    RENDERER --> APP
    APP --> ROUTER
    RENDERER --> STORES
    RENDERER --> VIEWS
    VIEWS --> COMPS

    CORE <--> API
    CORE <--> WS
    CORE <--> QUERY
```

## Process Model

```mermaid
flowchart LR
    subgraph "Renderer (UI)"
        R1[Vue Component] --> R2[Pinia Store Update]
        R2 --> R3[Preload API Call]
    end

    subgraph "Main (Privileged)"
        M1[IPC Handler] --> M2[Core Module]
        M2 --> M3[Node.js APIs]
    end

    subgraph "Worker Threads"
        W[Runner Worker]
    end

    R3 -- ipcRenderer.invoke --> M1
    M2 --> W
    M1 -- IPC Response --> R2
```

## Core Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Stores
    participant Preload
    participant Main
    participant Executor

    User->>Component: Interact with UI
    Component->>Stores: Update state
    Component->>Preload: Call window.api
    Preload->>Main: IPC invoke
    Main->>Executor: Run request logic
    Executor->>Main: Return results
    Main->>Preload: IPC response
    Preload->>Stores: Update store
    Stores->>Component: Re-render
```

## Project Structure

```mermaid
mindmap
  root((app/src))
    views[Page Views]
      Collections
      Request
      Runner
      Stats
      Settings
    components[UI Components]
      collection
      request
      base
      common
    stores[Pinia State]
      collection.ts
      request.ts
      environment.ts
      secret.ts
      runner.ts
      stats.ts
      ui.ts
    core[Execution Logic]
      executionEngine.ts
      ipcHandlers.ts
      requestExecutor.ts
      httpClient.ts
      httpExecutor.ts
      authHandler.ts
      runnerEngine.ts
      loadTestingService.ts
      runnerWorker.ts
    types[TypeScript Interfaces]
    router[Vue Router]
```

## Request Execution Pipeline

```mermaid
graph TD
    A[Request Data] --> B[Variable Substitution]
    B --> C[Auth Resolution]
    C --> D[Method Detection]
    D --> E{isWebSocket?}
    E -->|Yes| F[WebSocket Executor]
    E -->|No| G{isJsonRpc?}
    G -->|Yes| H[HTTP as JSON-RPC]
    G -->|No| I[HTTP Client]
    I --> J[Response History]
    H --> J
    F --> J
    J --> K[Store Update]
```

## Runner Architecture

```mermaid
graph TB
    subgraph "Runner Orchestration"
        RE[RunnerEngine]
        RC[Run Configuration]
        RW[RunnerWorker]
    end

    subgraph "Metrics Flow"
        LS[LoadTestingService]
        DB[(Local DB)]
        CHART[Chart.js UI]
    end

    RE --> RC
    RC --> RW
    RW --> LS
    LS --> DB
    DB --> CHART
```

## Data Flow

```mermaid
graph LR
    subgraph "Local Storage"
        COL[Collections]
        REQ[Requests]
        ENV[Environments]
        SEC[Secrets]
        UI[UI State]
    end

    subgraph "Persistent Storage"
        LTR[Load Test Runs]
    end

    Store --> COL
    Store --> REQ
    Store --> ENV
    Store --> SEC
    Store --> UI
    LS --> LTR
```

## Security Model

- **Main Process**: Owns all privileged APIs (filesystem, child processes, network)
- **Preload Bridge**: Typed, minimal `contextBridge` exposing only necessary methods
- **Renderer**: Sandboxed, communicates via IPC only
- **Secrets**: Encrypted at rest, decrypted only when vault is unlocked

## Development Commands

From project root:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run mock-server` | Test server on `127.0.0.1:4010` |
| `npx vite build` | Validate renderer/main/preload build |
| `npm run make` | Electron Forge packaging |

## Key Concepts

- **Collections**: Organize requests in folders
- **Environments**: Variable substitution for requests
- **Secrets**: Encrypted storage for sensitive values
- **Runner**: Execute single or multiple requests
- **Load Testing**: Concurrent request execution with metrics

## OpenTelemetry Integration

The Scenario Runner can export load test metrics to an OpenTelemetry collector:

```mermaid
graph LR
    subgraph "Load Test"
        LE[Load Test Execution]
        LS[LoadTestingService]
    end

    subgraph "OTel Export"
        OE[OpenTelemetryExporter]
        COL[OTel Collector]
    end

    LE --> LS
    LS -- Stats --> OE
    OE -- OTLP --> COL
```

### Configuration

Settings → Advanced → OpenTelemetry:
- **Endpoint**: OTLP HTTP endpoint (e.g., `http://localhost:4318/v1/traces`)
- **User ID**: Identifier for the runner (supports `{{secret.name}}` variable substitution)

### Mock Server OTel Endpoint

`POST http://127.0.0.1:4010/otel/v1/traces`

## Mock Server Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| HTTP | `/http/*` | Generic HTTP echo |
| Auth | `/http/auth/basic` | Basic auth required |
| Auth | `/http/auth/bearer` | Bearer token required |
| Auth | `/http/auth/apikey` | API key required |
| GraphQL | `/graphql` | GraphQL endpoint |
| JSON-RPC | `/json-rpc` | JSON-RPC 2.0 |
| OTel | `/otel/v1/traces` | OpenTelemetry collector mock |