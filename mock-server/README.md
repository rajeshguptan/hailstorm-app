# Hailstorm Mock Server

Standalone mock server for testing API client behavior. Run from `mock-server/`:

```bash
npm install
npm start
```

The server listens on `http://127.0.0.1:4010` by default and includes endpoints for HTTP methods/status/delay/auth, GraphQL, JSON-RPC, OAuth, WebSocket, and rate limiting.

## Setup

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Or run tests:

```bash
npm test
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the mock server |
| `npm test` | Run smoke tests |

## Endpoints

### HTTP

| Method | Endpoint | Description |
| --- | --- | --- |
| GET/POST | `/http/*` | Generic HTTP echo endpoint |
| GET/POST | `/http/auth/basic` | Basic auth (use `hailstorm:mock`) |
| GET/POST | `/http/auth/bearer` | Bearer auth (use `Bearer hailstorm-token`) |
| GET/POST | `/http/auth/apikey` | API key auth (use `x-api-key: hailstorm-api-key`) |
| GET/POST | `/http/auth/ntlm` | NTLM challenge endpoint |
| GET | `/http/auth/client-certificate` | Client certificate endpoint |
| POST | `/http/form-data` | Form data handling |
| POST | `/http/raw` | Raw body handling |
| POST | `/http/binary` | Binary body handling |
| GET | `/http/status/:code` | Returns specified status code |
| GET | `/http/delay/:ms` | Delayed response |
| GET | `/http/error` | Returns 500 error |

### GraphQL

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/graphql` | GraphQL query handler |
| POST | `/graphql/errors` | Returns GraphQL errors |

### JSON-RPC

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/json-rpc` | JSON-RPC 2.0 handler (methods: echo, add, getUser, introspect, error) |

### OAuth

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/oauth/token` | OAuth token endpoint |
| POST | `/oauth2/token` | OAuth2 token endpoint |

### Users API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/users` | List all users |
| POST | `/users` | Create user (requires `name` and `email`) |

### File Upload

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/upload` | File upload (multipart/form-data) |

### Rate Limiting

Configure per-request rate limiting:

```bash
curl -X POST http://127.0.0.1:4010/rps/my-request \
  -H "Content-Type: application/json" \
  -d '{"rps": 10}'
```

Check rate limit status:

```bash
curl http://127.0.0.1:4010/rps
```

Send rate-limited requests:

```bash
curl -H "X-Request-ID: my-request" \
     -H "X-RPS: 5" \
     http://127.0.0.1:4010/users
```

### WebSocket

| Endpoint | Description |
| --- | --- |
| `ws://127.0.0.1:4010/ws` | Echo server - echoes back received messages |
| `ws://127.0.0.1:4010/ws/chat` | Chat server - broadcasts messages to all clients |

### Health Check

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Server health status |

## Usage with Hailstorm

Use the mock endpoints when testing Hailstorm against a stable local backend. The mock server is also run automatically for integration tests via `npm run mock-server` from the `app/` directory.