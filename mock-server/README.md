# Mock API Server for Hailstorm

A simple mock API server that satisfies the test collection endpoints using an in-memory Map store.

## Setup

1. Install dependencies:
```bash
cd mock-server
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## Files

- `server.js` - Main Express server implementation
- `mock-collection.json` - Postman collection for testing the mock API
- `openapi-spec.json` - OpenAPI 3.0 specification for the API
- `test.js` - Test script to verify endpoints
- `README.md` - This documentation

## Rate Limiting

The server implements token bucket algorithm for rate limiting per request:

- **Token Bucket**: Each request ID maintains its own token bucket
- **Refill Rate**: Tokens are added at the configured RPS rate
- **Burst Capacity**: Maximum tokens equals the RPS setting
- **Headers**: Rate limit headers are included in responses

### Usage with Hailstorm

1. Set RPS per request in the RunnerPanel (RPS column)
2. The RPS setting will be automatically enforced by the mock server

### Rate Limit Response

When rate limited (HTTP 429):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 1,
  "currentRps": 5
}
```

### Response Headers

Successful requests include:
- `X-RateLimit-Limit`: Maximum RPS
- `X-RateLimit-Remaining`: Remaining tokens
- `X-RateLimit-Reset`: Reset timestamp

### Manual RPS Configuration

You can also manually configure RPS limits:

```bash
# Set RPS for a specific request
curl -X POST http://localhost:3001/rps/my-request \
  -H "Content-Type: application/json" \
  -d '{"rps": 10}'

# Check current RPS settings
curl http://localhost:3001/rps
```

## Testing

Run the included test script to verify all endpoints work correctly:

```bash
npm test
```

## API Documentation

The API is fully documented in `openapi-spec.json` following the OpenAPI 3.0 specification. You can import this file into tools like Swagger UI, Postman, or any OpenAPI-compatible documentation viewer.

## Endpoints

### GET /users
Returns a list of all users in the system.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
]
```

### POST /users
Creates a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-12-01T10:30:00.000Z"
}
```

### POST /upload
Handles file uploads with optional description.

**Form Data:**
- `file`: The file to upload
- `description`: Optional description text

**Response:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "success": true,
    "filename": "example.txt",
    "size": 1024,
    "description": "Test file",
    "uploadedAt": "2023-12-01T11:00:00.000Z"
  }
}
```

### GET /health
Health check endpoint with rate limiting status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "usersCount": 2,
  "rateLimiting": {
    "user-creation": {
      "rps": 5,
      "tokens": 4.2,
      "capacity": 5
    }
  }
}
```

### POST /rps/{requestId}
Set RPS (requests per second) limit for a specific request.

**Request Body:**
```json
{
  "rps": 10
}
```

**Response:**
```json
{
  "requestId": "user-creation",
  "rps": 10,
  "message": "RPS updated successfully"
}
```

### GET /rps
Get rate limiting status for all requests.

**Response:**
```json
{
  "user-creation": {
    "rps": 10,
    "tokens": 8.5,
    "capacity": 10,
    "lastRefill": "2023-12-01T12:00:00.000Z"
  }
}
```

## Data Storage

The server uses an in-memory Map to store user data. Data persists only during the server runtime and is lost when the server restarts.

## Testing with Hailstorm

Update your test collection URLs from `https://api.example.com` to `http://localhost:3001` to test against this mock server.