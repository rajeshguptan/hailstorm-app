# Hailstorm Mock API Server

A standalone Express-based mock API server for testing API client behavior outside the Electron app. It provides deterministic HTTP endpoints, upload handling, health checks, and optional rate-limit metadata.

This server is separate from `app/scripts/mock-server.js`, which is the local test server bundled with the Hailstorm app.

## Setup

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The server listens on `http://localhost:3001` by default.

## Available scripts

```bash
npm start   # Start the mock server
npm dev     # Start the mock server in development mode
npm test    # Run endpoint smoke tests
```

## Files

| File | Purpose |
| --- | --- |
| `server.js` | Express server implementation |
| `mock-collection.json` | Postman collection for exercising the mock API |
| `openapi-spec.json` | OpenAPI 3.0 specification |
| `test.js` | Smoke test script |
| `README.md` | This documentation |

## Rate limiting

The server includes token-bucket rate limiting metadata for request scenarios.

- Each request identifier maintains its own bucket.
- Tokens refill at the configured RPS rate.
- Burst capacity equals the configured RPS.
- Responses include rate-limit headers when applicable.

### Configure RPS

```bash
curl -X POST http://localhost:3001/rps/my-request \
  -H "Content-Type: application/json" \
  -d '{"rps": 10}'
```

### Inspect RPS settings

```bash
curl http://localhost:3001/rps
```

### Rate-limit response shape

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 1,
  "currentRps": 5
}
```

### Response headers

Successful responses include:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Testing

Run the included smoke tests:

```bash
npm test
```

## API documentation

The API is documented in `openapi-spec.json` using OpenAPI 3.0. Import this file into Swagger UI, Postman, Insomnia, or another OpenAPI-compatible tool.

## Data storage

The server uses in-memory storage. Data is available only while the process is running and is reset on restart.

## Usage with Hailstorm

Use this server when you want to test Hailstorm against a stable local backend without relying on external services. Replace remote endpoint URLs with `http://localhost:3001` for local API client tests.
