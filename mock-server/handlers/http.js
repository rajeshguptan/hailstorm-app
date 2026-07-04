const { now, getHeader, getRequestBody } = require('../utils/helpers');

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

module.exports = {
  respondHttp,
  runGraphqlQuery,
  handleJsonRpcRequest,
  createTokenResponse
};