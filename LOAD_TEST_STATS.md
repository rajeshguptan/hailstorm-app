# Load Test Stats Storage

Stats are handled through a **dual-layer approach**: in-memory rolling windows for live updates plus persistent file-based storage for data durability.

## 1. In-Memory (Live Updates)

**Location:** `app/src/stores/loadTest.ts`

The `liveStats` state object tracks real-time counters:

- `totalRequests`, `successfulRequests`, `failedRequests`
- `avgResponseTime`, `requestsPerSecond`
- `recentRequests` array (last 50 requests with details)

**Rolling Window:** A 5-minute sliding window keeps aggregated metrics per second:

- Stored in `rollingWindowData` (array of `{timestamp, requests, errors, responseTimes[]}`)
- Per-request-name breakdown in `rollingWindowByRequestData`
- Auto-capped to prevent memory growth (300 buckets max, 100 response times per bucket)

## 2. Persistent Storage (Survives App Restart)

**Location:** `app/src/core/executionEngine.ts` → `LoadTestingService`

Stats are written to disk every 100 requests:

- **`runs.json`** — Run metadata and counters
- **`request_index.json`** — Index of all requests (status, latency, timestamp)
- **`run_metrics.json`** — Time-bucketed aggregated metrics
- **`detail_chunks.json`** — References to compressed request/response details
- **Individual gzipped files** — Full request/response for failed requests (status ≥ 500)

## 3. Worker Thread Architecture

**How it avoids blocking:**

- HTTP requests execute in Node.js worker threads (`runnerWorker.ts`)
- Thread pool size = CPU cores (via `workerThreadPool.ts`)
- Results stream back through IPC callbacks to update `liveStats`

## 4. Memory Management Strategy

| Component | Strategy |
|-----------|----------|
| `liveStats` | Simple counters, negligible memory |
| `rollingWindowData` | Capped at 300 entries (5 min × 60 sec) |
| `recentRequests` | Fixed 50-entry array |
| `requestIndex` | Persisted to disk every 100 requests |
| Request details | Only kept for errors; other data gzipped to files |