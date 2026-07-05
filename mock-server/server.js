const http = require('http');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 4010;
const HOST = process.env.HOST || '127.0.0.1';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// === Base Middleware ===
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('X-Mock-Server', 'Hailstorm');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cors());

// === Helpers ===
const now = () => new Date().toISOString();

const getHeader = (req, name) => req.headers[name.toLowerCase()] || '';

const getRequestBody = (req) => {
  if (req.is('multipart/form-data')) {
    return {
      fields: req.body || {},
      files: (req.files || []).map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        encoding: f.encoding,
        mimetype: f.mimetype,
        size: f.size
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
};

function respondHttp(req, res, statusCode = 200) {
  const h = (n) => req.headers[n.toLowerCase()] || '';
  res.status(statusCode).json({
    ok: statusCode >= 200 && statusCode < 400,
    status: statusCode,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
    params: req.params,
    headers: { authorization: h('authorization'), contentType: h('content-type'), xApiKey: h('x-api-key'), userAgent: h('user-agent') },
    body: getRequestBody(req),
    receivedAt: now()
  });
}

// === Auth Middleware ===
const parseBasicAuth = (value) => {
  if (!value?.startsWith('Basic ')) return null;
  const decoded = Buffer.from(value.slice(6), 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  return sep === -1 ? null : { username: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
};

const requireBasicAuth = (req, res, next) => {
  const c = parseBasicAuth(getHeader(req, 'authorization'));
  if (!c || c.username !== 'hailstorm' || c.password !== 'mock') {
    return res.status(401).set('WWW-Authenticate', 'Basic realm="Hailstorm Mock"').json({ error: 'Missing or invalid basic auth. Use hailstorm:mock' });
  }
  next();
};

const requireBearerAuth = (req, res, next) => {
  if (getHeader(req, 'authorization') === 'Bearer hailstorm-token') return next();
  res.status(401).json({ error: 'Missing or invalid bearer token. Use Bearer hailstorm-token' });
};

const requireApiKey = (req, res, next) => {
  const apiKey = getHeader(req, 'x-api-key') || req.query.api_key || req.query.apiKey;
  if (apiKey === 'hailstorm-api-key') return next();
  res.status(401).json({ error: 'Missing or invalid API key. Use x-api-key: hailstorm-api-key or ?api_key=hailstorm-api-key' });
};

// === GraphQL ===
const runGraphqlQuery = (query = '', variables = {}, operationName = '') => {
  const q = query.replace(/\s+/g, ' ');
  if (q.includes('__schema')) return { data: { __schema: { queryType: { name: 'Query' }, types: [{ name: 'Query', fields: [{ name: 'ping' }, { name: 'user' }, { name: 'users' }] }, { name: 'User', fields: [{ name: 'id' }, { name: 'name' }, { name: 'email' }] }] } } };
  if (q.includes('users')) return { data: { users: [{ id: '1', name: 'Ada Lovelace', email: 'ada@example.test' }, { id: '2', name: 'Grace Hopper', email: 'grace@example.test' }] } };
  if (q.includes('user')) return { data: { user: { id: String(variables?.id || 1), name: 'Ada Lovelace', email: 'ada@example.test' } } };
  if (q.includes('ping')) return { data: { ping: 'pong' } };
  return { data: { ok: true, operationName: operationName || null, variables } };
};

// === JSON-RPC ===
const handleJsonRpcRequest = (payload) => {
  const calls = Array.isArray(payload) ? payload : [payload];
  const responses = calls.map((r) => {
    if (!r || r.jsonrpc !== '2.0' || !r.method) {
      return { jsonrpc: '2.0', id: Object.prototype.hasOwnProperty.call(r || {}, 'id') ? r.id : null, error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' } };
    }
    try {
      let result;
      switch (r.method) {
        case 'echo': result = { input: r.params ?? {}, receivedAt: now() }; break;
        case 'add': result = Array.isArray(r.params) ? r.params.reduce((s, v) => s + Number(v), 0) : Number(r.params?.a || 0) + Number(r.params?.b || 0); break;
        case 'getUser': result = { id: String(r.params?.id || 1), name: 'Ada Lovelace', email: 'ada@example.test' }; break;
        case 'introspect': result = { methods: ['echo', 'add', 'getUser', 'introspect'], version: '2.0' }; break;
        case 'error': throw Object.assign(new Error('Requested mock JSON-RPC error'), { code: r.params?.code || -32000 });
        default: return { jsonrpc: '2.0', id: r.id, error: { code: -32601, message: `Method not found: ${r.method}` } };
      }
      return { jsonrpc: '2.0', id: r.id, result };
    } catch (e) {
      return { jsonrpc: '2.0', id: r.id, error: { code: e.code || -32603, message: e.message } };
    }
  }).filter(Boolean);
  return Array.isArray(payload) ? responses : responses[0];
};

// === OAuth ===
const createTokenResponse = (req) => ({
  access_token: 'hailstorm-oauth-token',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: req.body?.scope || 'read write',
  grant_type: req.body?.grant_type || req.body?.grantType || 'client_credentials',
  issued_at: now()
});

// === Stores ===
const usersStore = new Map();
let userIdCounter = 1;
usersStore.set(1, { id: 1, name: 'Jane Doe', email: 'jane@example.com', createdAt: now() });

// === HTTP Routes ===
app.all('/http/auth/basic', requireBasicAuth, (req, res) => respondHttp(req, res));
app.all('/http/auth/bearer', requireBearerAuth, (req, res) => respondHttp(req, res));
app.all('/http/auth/apikey', requireApiKey, (req, res) => respondHttp(req, res));

app.all('/http/auth/ntlm', (req, res) => {
  if (!req.headers.authorization) return res.set('WWW-Authenticate', 'NTLM').status(401).json({ error: 'NTLM challenge. This mock verifies that the NTLM header is sent.' });
  respondHttp(req, res);
});

app.get('/http/auth/client-certificate', (req, res) => respondHttp(req, res, 200));
app.post('/http/form-data', upload.any(), (req, res) => respondHttp(req, res));
app.all('/http/raw', express.raw({ type: '*/*', limit: '5mb' }), (req, res) => respondHttp(req, res));
app.all('/http/binary', express.raw({ type: '*/*', limit: '5mb' }), (req, res) => respondHttp(req, res));

app.all('/http/status/:code', (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code) || code < 100 || code > 599) return res.status(400).json({ error: 'Status code must be between 100 and 599' });
  respondHttp(req, res, code);
});

app.all('/http/delay/:ms', (req, res) => {
  const d = Number(req.params.ms);
  if (!Number.isFinite(d) || d < 0 || d > 30000) return res.status(400).json({ error: 'Delay must be between 0 and 30000 ms' });
  setTimeout(() => respondHttp(req, res), d);
});

app.all('/http/error', (req, res) => res.status(500).json({ error: 'Intentional mock server error', method: req.method, path: req.path, body: getRequestBody(req), receivedAt: now() }));
app.all('/http/*', (req, res) => respondHttp(req, res));

// === GraphQL Routes ===
app.all('/graphql', (req, res) => {
  const body = req.body || {};
  res.json(runGraphqlQuery(typeof body === 'string' ? body : body.query || '', typeof body === 'string' ? {} : body.variables || {}, typeof body === 'string' ? '' : body.operationName || ''));
});

app.post('/graphql/errors', (req, res) => res.status(200).json({ errors: [{ message: 'Mock GraphQL resolver error', locations: [{ line: 1, column: 1 }], path: ['user'] }] }));

// === JSON-RPC Routes ===
app.post('/json-rpc', (req, res) => res.json(handleJsonRpcRequest(req.body)));

// === OAuth Routes ===
app.post(['/oauth/token', '/oauth2/token'], (req, res) => res.json(createTokenResponse(req)));

// === Users Routes ===
app.get('/users', (req, res) => res.json(Array.from(usersStore.values())));

app.post('/users', (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const newUser = { id: ++userIdCounter, name, email, createdAt: now() };
  usersStore.set(newUser.id, newUser);
  res.status(201).json(newUser);
});

// === File Upload ===
app.post('/upload', upload.single('file'), (req, res) => {
  const { description } = req.body || {};
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  res.status(200).json({ message: 'File uploaded successfully', data: { filename: file.originalname, size: file.size, description: description || 'No description provided', uploadedAt: now() } });
});

// === OpenTelemetry Collector Endpoint ===
const otelTraces = [];

app.post('/otel/v1/traces', (req, res) => {
  const traceData = req.body;
  otelTraces.push({
    receivedAt: now(),
    ...traceData
  });
  console.log('[OTEL_MOCK] Received trace:', traceData.resource?.attributes?.find?.(a => a.key === 'run.name')?.value?.stringValue || 'unknown');
  res.status(200).json({ success: true });
});

app.get('/otel/v1/traces', (req, res) => {
  res.json(otelTraces);
});

// === Health check ===
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: now(), usersCount: usersStore.size });
});

// === Root ===
app.get('/', (req, res) => res.json({
  name: 'Hailstorm Mock Server',
  endpoints: {
    http: '/http/*', basicAuth: '/http/auth/basic', bearerAuth: '/http/auth/bearer', apiKey: '/http/auth/apikey',
    ntlm: '/http/auth/ntlm', clientCertificate: '/http/auth/client-certificate', form: '/http/form-data',
    raw: '/http/raw', binary: '/http/binary', status: '/http/status/:code', delay: '/http/delay/:ms',
    error: '/http/error', graphql: '/graphql', jsonRpc: '/json-rpc', users: '/users', upload: '/upload',
    websocket: 'ws://127.0.0.1:4010/ws', websocketChat: 'ws://127.0.0.1:4010/ws/chat',
    oauthToken: '/oauth/token', oauth2Token: '/oauth2/token',
    otel: '/otel/v1/traces'
  }
}));

// === WebSocket ===
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

wss.on('connection', (socket, req) => {
  if (socket.mockPath === '/ws/chat') {
    const crypto = require('crypto');
    const clientId = crypto.randomUUID();
    let sent = 0;
    socket.send(JSON.stringify({ type: 'chat', message: 'Connected to Hailstorm mock chat', lastMessage: null, messagesSent: 0 }));
    socket.on('message', (data) => {
      sent++;
      let parsed;
      try { parsed = JSON.parse(data.toString()); } catch { parsed = data.toString(); }
      const broadcast = [...wss.clients].filter((c) => c.readyState === c.OPEN && c.mockPath === '/ws/chat');
      broadcast.forEach((client) => {
        if (client !== socket) client.send(JSON.stringify({ type: 'broadcast', from: clientId, path: socket.mockPath, receivedAt: now(), payload: data.toString() }));
      });
      socket.send(JSON.stringify({
        type: 'chat', message: typeof parsed === 'object' && parsed.message ? parsed.message : data.toString(),
        lastMessage: data.toString(), messagesSent: sent, deliveredTo: broadcast.length - 1
      }));
    });
  } else {
    const crypto = require('crypto');
    const clientId = crypto.randomUUID();
    socket.on('message', (data, isBinary) => {
      const payload = isBinary ? { encoding: 'base64', size: data.length, content: data.toString('base64') } : (() => { try { return JSON.parse(data.toString()); } catch { return data.toString(); } })();
      socket.send(JSON.stringify({ type: 'echo', clientId, path: socket.mockPath || '/ws', receivedAt: now(), isBinary, payload }));
    });
  }
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  if (url.pathname !== '/ws' && url.pathname !== '/ws/chat') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => { ws.mockPath = url.pathname; wss.emit('connection', ws, req); });
});

server.listen(PORT, HOST, () => {
  console.log(`Hailstorm mock server listening at http://${HOST}:${PORT}`);
  console.log(`WebSocket endpoints: ws://${HOST}:${PORT}/ws and ws://${HOST}:${PORT}/ws/chat`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));