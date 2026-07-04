const http = require('http');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 4010;
const HOST = process.env.HOST || '127.0.0.1';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('X-Mock-Server', 'Hailstorm');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

const usersStore = new Map();
let userIdCounter = 1;
usersStore.set(userIdCounter, {
  id: userIdCounter,
  name: 'Jane Doe',
  email: 'jane@example.com',
  createdAt: new Date().toISOString()
});

const tokenBuckets = new Map();

class TokenBucket {
  constructor(rps) {
    this.capacity = rps;
    this.tokens = rps;
    this.rps = rps;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.rps;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  setRps(newRps) {
    this.rps = newRps;
    this.capacity = newRps;
    this.tokens = Math.min(this.tokens, this.capacity);
  }
}

function rateLimit(req, res, next) {
  const requestId = req.headers['x-request-id'] || req.path;
  const rps = parseFloat(req.headers['x-rps']) || 0;

  if (!rps || rps <= 0) {
    return next();
  }

  if (!tokenBuckets.has(requestId)) {
    tokenBuckets.set(requestId, new TokenBucket(rps));
  }

  const bucket = tokenBuckets.get(requestId);

  if (bucket.rps !== rps) {
    bucket.setRps(rps);
  }

  if (bucket.consume()) {
    res.set({
      'X-RateLimit-Limit': bucket.capacity.toString(),
      'X-RateLimit-Remaining': Math.floor(bucket.tokens).toString(),
      'X-RateLimit-Reset': Math.ceil((bucket.lastRefill + 1000) / 1000).toString()
    });
    next();
  } else {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(1 / rps),
      currentRps: rps
    });
  }
}

function now() {
  return new Date().toISOString();
}

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value || '';
}

function getRequestBody(req) {
  if (req.is('multipart/form-data')) {
    return {
      fields: req.body || {},
      files: (req.files || []).map(file => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size
      }))
    };
  }

  if (Buffer.isBuffer(req.body)) {
    return {
      encoding: 'base64',
      size: req.body.length,
      content: req.body.toString('base64')
    };
  }

  return req.body ?? null;
}

function respondHttp(req, res, statusCode = 200) {
  res.status(statusCode).json({
    ok: statusCode >= 200 && statusCode < 400,
    status: statusCode,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
    params: req.params,
    headers: {
      authorization: getHeader(req, 'authorization'),
      contentType: getHeader(req, 'content-type'),
      xApiKey: getHeader(req, 'x-api-key'),
      userAgent: getHeader(req, 'user-agent')
    },
    body: getRequestBody(req),
    receivedAt: now()
  });
}

function parseBasicAuth(value) {
  if (!value || !value.startsWith('Basic ')) return null;
  const decoded = Buffer.from(value.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return null;
  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1)
  };
}

function requireBasicAuth(req, res, next) {
  const credentials = parseBasicAuth(getHeader(req, 'authorization'));
  if (!credentials || credentials.username !== 'hailstorm' || credentials.password !== 'mock') {
    res.set('WWW-Authenticate', 'Basic realm="Hailstorm Mock"');
    res.status(401).json({ error: 'Missing or invalid basic auth. Use hailstorm:mock' });
    return;
  }
  next();
}

function requireBearerAuth(req, res, next) {
  const authorization = getHeader(req, 'authorization');
  if (authorization !== 'Bearer hailstorm-token') {
    res.status(401).json({ error: 'Missing or invalid bearer token. Use Bearer hailstorm-token' });
    return;
  }
  next();
}

function requireApiKey(req, res, next) {
  const apiKey = getHeader(req, 'x-api-key') || req.query.api_key || req.query.apiKey;
  if (apiKey !== 'hailstorm-api-key') {
    res.status(401).json({ error: 'Missing or invalid API key. Use x-api-key: hailstorm-api-key or ?api_key=hailstorm-api-key' });
    return;
  }
  next();
}

function createTokenResponse(req) {
  const body = req.body || {};
  const grantType = body.grant_type || body.grantType || 'client_credentials';
  return {
    access_token: 'hailstorm-oauth-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: body.scope || 'read write',
    grant_type: grantType,
    issued_at: now()
  };
}

function runGraphqlQuery(query = '', variables = {}, operationName = '') {
  const normalizedQuery = query.replace(/\s+/g, ' ');

  if (normalizedQuery.includes('__schema')) {
    return {
      data: {
        __schema: {
          queryType: { name: 'Query' },
          types: [
            { name: 'Query', fields: [{ name: 'ping' }, { name: 'user' }, { name: 'users' }] },
            { name: 'User', fields: [{ name: 'id' }, { name: 'name' }, { name: 'email' }] }
          ]
        }
      }
    };
  }

  if (normalizedQuery.includes('users')) {
    return {
      data: {
        users: [
          { id: '1', name: 'Ada Lovelace', email: 'ada@example.test' },
          { id: '2', name: 'Grace Hopper', email: 'grace@example.test' }
        ]
      }
    };
  }

  if (normalizedQuery.includes('user')) {
    return {
      data: {
        user: {
          id: String(variables?.id || 1),
          name: 'Ada Lovelace',
          email: 'ada@example.test'
        }
      }
    };
  }

  if (normalizedQuery.includes('ping')) {
    return { data: { ping: 'pong' } };
  }

  return {
    data: {
      ok: true,
      operationName: operationName || null,
      variables
    }
  };
}

function handleJsonRpcRequest(payload) {
  const calls = Array.isArray(payload) ? payload : [payload];

  const responses = calls.map(request => {
    if (!request || request.jsonrpc !== '2.0' || !request.method) {
      return {
        jsonrpc: '2.0',
        id: Object.prototype.hasOwnProperty.call(request || {}, 'id') ? request.id : null,
        error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' }
      };
    }

    try {
      const params = request.params ?? {};
      let result;

      switch (request.method) {
        case 'echo':
          result = { input: params, receivedAt: now() };
          break;
        case 'add':
          result = Array.isArray(params)
            ? params.reduce((sum, value) => sum + Number(value), 0)
            : Number(params.a || 0) + Number(params.b || 0);
          break;
        case 'getUser':
          result = {
            id: String(params.id || 1),
            name: 'Ada Lovelace',
            email: 'ada@example.test'
          };
          break;
        case 'introspect':
          result = {
            methods: ['echo', 'add', 'getUser', 'introspect'],
            version: '2.0'
          };
          break;
        case 'error':
          throw Object.assign(new Error('Requested mock JSON-RPC error'), { code: params.code || -32000 });
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: `Method not found: ${request.method}` }
          };
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: error.code || -32603,
          message: error.message
        }
      };
    }
  }).filter(Boolean);

  return Array.isArray(payload) ? responses : responses[0];
}

function attachEchoSocket(socket, path) {
  const crypto = require('crypto');
  const clientId = crypto.randomUUID();

  socket.on('message', (data, isBinary) => {
    const payload = isBinary
      ? { encoding: 'base64', size: data.length, content: data.toString('base64') }
      : (() => {
          const text = data.toString();
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        })();

    const response = {
      type: 'echo',
      clientId,
      path,
      receivedAt: now(),
      isBinary,
      payload
    };

    socket.send(JSON.stringify(response));
  });
}

wss.on('connection', (socket, req) => {
  if (socket.mockPath === '/ws/chat') {
    const crypto = require('crypto');
    const clientId = crypto.randomUUID();
    let messagesSent = 0;

    socket.send(JSON.stringify({
      type: 'chat',
      message: 'Connected to Hailstorm mock chat',
      lastMessage: null,
      messagesSent: 0
    }));

    socket.on('message', (data) => {
      messagesSent += 1;

      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        parsed = data.toString();
      }

      const message = {
        type: 'broadcast',
        from: clientId,
        path: socket.mockPath,
        receivedAt: now(),
        payload: data.toString()
      };

      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN && client !== socket && client.mockPath === '/ws/chat') {
          client.send(JSON.stringify(message));
        }
      });

      socket.send(JSON.stringify({
        type: 'chat',
        message: typeof parsed === 'object' && parsed.message
          ? parsed.message
          : data.toString(),
        lastMessage: data.toString(),
        messagesSent,
        deliveredTo: [...wss.clients].filter(client => client.readyState === client.OPEN && client.mockPath === '/ws/chat').length - 1
      }));
    });
    return;
  }

  attachEchoSocket(socket, socket.mockPath || '/ws');
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  if (url.pathname !== '/ws' && url.pathname !== '/ws/chat') {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, ws => {
    ws.mockPath = url.pathname;
    wss.emit('connection', ws, req);
  });
});

// HTTP Mock endpoints
app.all('/http/auth/basic', requireBasicAuth, (req, res) => respondHttp(req, res));
app.all('/http/auth/bearer', requireBearerAuth, (req, res) => respondHttp(req, res));
app.all('/http/auth/apikey', requireApiKey, (req, res) => respondHttp(req, res));
app.all('/http/auth/ntlm', (req, res) => {
  if (!getHeader(req, 'authorization')) {
    res.set('WWW-Authenticate', 'NTLM');
    res.status(401).json({ error: 'NTLM challenge. This mock verifies that the NTLM header is sent.' });
    return;
  }
  respondHttp(req, res);
});
app.get('/http/auth/client-certificate', (req, res) => respondHttp(req, res, 200));
app.post('/http/form-data', upload.any(), rateLimit, (req, res) => respondHttp(req, res));
app.all('/http/raw', express.raw({ type: '*/*', limit: '5mb' }), rateLimit, (req, res) => respondHttp(req, res));
app.all('/http/binary', express.raw({ type: '*/*', limit: '5mb' }), rateLimit, (req, res) => respondHttp(req, res));

app.all('/http/status/:code', (req, res) => {
  const statusCode = Number(req.params.code);
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    res.status(400).json({ error: 'Status code must be between 100 and 599' });
    return;
  }
  respondHttp(req, res, statusCode);
});

app.all('/http/delay/:ms', (req, res) => {
  const delay = Number(req.params.ms);
  if (!Number.isFinite(delay) || delay < 0 || delay > 30000) {
    res.status(400).json({ error: 'Delay must be between 0 and 30000 ms' });
    return;
  }
  setTimeout(() => respondHttp(req, res), delay);
});

app.all('/http/error', (req, res) => {
  res.status(500).json({
    error: 'Intentional mock server error',
    method: req.method,
    path: req.path,
    body: getRequestBody(req),
    receivedAt: now()
  });
});

app.all('/http/*', rateLimit, (req, res) => respondHttp(req, res));

// GraphQL endpoints
app.all('/graphql', (req, res) => {
  const body = req.body || {};
  const query = typeof body === 'string' ? body : body.query || '';
  const variables = typeof body === 'string' ? {} : body.variables || {};
  const operationName = typeof body === 'string' ? '' : body.operationName || '';
  res.json(runGraphqlQuery(query, variables, operationName));
});

app.post('/graphql/errors', (req, res) => {
  res.status(200).json({
    errors: [
      {
        message: 'Mock GraphQL resolver error',
        locations: [{ line: 1, column: 1 }],
        path: ['user']
      }
    ]
  });
});

// JSON-RPC endpoint
app.post('/json-rpc', rateLimit, (req, res) => {
  res.json(handleJsonRpcRequest(req.body));
});

// OAuth endpoints
app.post(['/oauth/token', '/oauth2/token'], rateLimit, (req, res) => {
  res.json(createTokenResponse(req));
});

// Users endpoints (from mock-server)
app.get('/users', rateLimit, (req, res) => {
  const users = Array.from(usersStore.values());
  res.json(users);
});

app.post('/users', rateLimit, (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const newUser = {
    id: ++userIdCounter,
    name,
    email,
    createdAt: new Date().toISOString()
  };

  usersStore.set(newUser.id, newUser);
  res.status(201).json(newUser);
});

// File upload endpoint
app.post('/upload', rateLimit, upload.single('file'), (req, res) => {
  const { description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadResult = {
    success: true,
    filename: file.originalname,
    size: file.size,
    description: description || 'No description provided',
    uploadedAt: new Date().toISOString()
  };

  res.status(200).json({
    message: 'File uploaded successfully',
    data: uploadResult
  });
});

// RPS management
app.post('/rps/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { rps } = req.body;

  if (typeof rps !== 'number' || rps < 0) {
    return res.status(400).json({ error: 'RPS must be a non-negative number' });
  }

  if (!tokenBuckets.has(requestId)) {
    tokenBuckets.set(requestId, new TokenBucket(rps));
  } else {
    tokenBuckets.get(requestId).setRps(rps);
  }

  res.json({ requestId, rps, message: 'RPS updated successfully' });
});

app.get('/rps', (req, res) => {
  const status = {};
  for (const [requestId, bucket] of tokenBuckets.entries()) {
    status[requestId] = {
      rps: bucket.rps,
      tokens: bucket.tokens,
      capacity: bucket.capacity,
      lastRefill: new Date(bucket.lastRefill).toISOString()
    };
  }
  res.json(status);
});

// Health check
app.get('/health', (req, res) => {
  const rateLimitInfo = {};
  for (const [requestId, bucket] of tokenBuckets.entries()) {
    rateLimitInfo[requestId] = {
      rps: bucket.rps,
      tokens: Math.round(bucket.tokens * 100) / 100,
      capacity: bucket.capacity
    };
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    usersCount: usersStore.size,
    rateLimiting: rateLimitInfo
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Hailstorm Mock Server',
    endpoints: {
      http: '/http/*',
      basicAuth: '/http/auth/basic',
      bearerAuth: '/http/auth/bearer',
      apiKey: '/http/auth/apikey',
      ntlm: '/http/auth/ntlm',
      clientCertificate: '/http/auth/client-certificate',
      form: '/http/form-data',
      raw: '/http/raw',
      binary: '/http/binary',
      status: '/http/status/:code',
      delay: '/http/delay/:ms',
      error: '/http/error',
      graphql: '/graphql',
      jsonRpc: '/json-rpc',
      users: '/users',
      upload: '/upload',
      websocket: 'ws://127.0.0.1:4010/ws',
      websocketChat: 'ws://127.0.0.1:4010/ws/chat',
      oauthToken: '/oauth/token',
      oauth2Token: '/oauth2/token',
      rateLimiting: '/rps'
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Hailstorm mock server listening at http://${HOST}:${PORT}`);
  console.log(`WebSocket endpoints: ws://${HOST}:${PORT}/ws and ws://${HOST}:${PORT}/ws/chat`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});