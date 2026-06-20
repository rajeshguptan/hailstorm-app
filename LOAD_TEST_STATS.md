# Load Test Stats Storage

Hailstorm stores load-test metrics in two layers:

1. A renderer-side rolling window for live Stats updates.
2. A main-process file store for completed runs and exportable results.

## Renderer live metrics

**Location:** `app/src/stores/loadTest.ts`

The `loadTestStore` keeps live counters and chart data while a run is active.

### Live counters

- `totalRequests`
- `successfulRequests`
- `failedRequests`
- `avgResponseTime`
- `requestsPerSecond`
- `startTime`
- `recentRequests`

### Rolling chart window

The store keeps a five-minute sliding window of one-second buckets:

- `rollingWindowData`: aggregated request, error, and response-time data.
- `rollingWindowByRequestData`: the same data split by request name.
- `maxRollingWindowSize`: 300 buckets.
- Per-bucket response times are capped to avoid unbounded memory growth.

The Stats panel reads these values to render live request volume, error volume, and response-time charts.

## Main-process persistence

**Location:** `app/src/core/loadTestingService.ts`

Completed load-test runs are persisted under the app data directory:

- Development: `<repo>/app/data/load-tests`
- Packaged app: `~/.hailstorm/load-tests`

### Stored files

| File | Purpose |
| --- | --- |
| `runs.json` | Run metadata, counters, start time, end time, and status |
| `request_index.json` | Compact index of every recorded request |
| `run_metrics.json` | Reserved for future time-bucketed metrics |
| `detail_chunks.json` | References to compressed request/response detail files |
| `<runId>/` directory | Gzipped detail files for requests that need full capture |

### Request index fields

Each request index entry includes:

- `runId`
- `requestId`
- `requestName`
- HTTP method
- URL and URL hash
- status code
- latency
- response size
- error flag
- timestamp
- sequence number

## Run lifecycle

1. `startRun()` creates a running run record and writes it to `runs.json`.
2. `recordRequest()` appends request index entries and updates counters.
3. Every 100 recorded requests, data is flushed to disk.
4. `endRun()` marks the run completed, sets `endTime`, and saves the final state.
5. `getRunStats()` recalculates totals, error rate, averages, min/max latency, and throughput from the request index.
6. `getTimeSeriesData()` and `getTimeSeriesDataByRequest()` return one-minute buckets for charts.
7. `exportRunData()` exports JSON or CSV output for a completed run.

## Stats calculations

- Total requests: number of request index entries for the run.
- Successful requests: entries where `error` is false.
- Failed requests: entries where `error` is true.
- Error rate: `(failedRequests / totalRequests) * 100`.
- Average response time: mean request latency.
- Min/max response time: minimum and maximum recorded latency.
- Requests per second: `totalRequests / durationSeconds`.

## Memory management

- Live Stats data is capped by time and bucket count.
- Full request/response details are stored only when capture is requested.
- Captured detail files are compressed with gzip.
- Completed run metadata and request indexes are stored on disk so Stats remains available after app restart.
