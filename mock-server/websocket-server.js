const { WebSocketServer } = require('ws');

const PORT = Number(process.env.WEBSOCKET_PORT) || 3002;
const PATH = process.env.WEBSOCKET_PATH || '/chat';

let messagesSent = 0;

function toMessage(data) {
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString('utf8');
  }

  return String(data);
}

function parseMessage(data) {
  const raw = toMessage(data);

  try {
    const payload = JSON.parse(raw);

    if (payload && typeof payload === 'object') {
      return {
        raw,
        message: typeof payload.message === 'string' ? payload.message : raw,
        payload
      };
    }

    return {
      raw,
      message: raw,
      payload
    };
  } catch (error) {
    return {
      raw,
      message: raw,
      payload: raw
    };
  }
}

const wss = new WebSocketServer({ port: PORT, path: PATH });

wss.on('connection', (socket) => {
  console.log(`[WS] client connected to ${PATH}`);

  socket.send(JSON.stringify({
    type: 'chat',
    message: 'Connected to Hailstorm mock chat',
    lastMessage: null,
    messagesSent: 0
  }));

  socket.on('message', (data) => {
    const parsed = parseMessage(data);
    messagesSent += 1;

    const response = {
      type: 'chat',
      message: parsed.message,
      lastMessage: parsed.message,
      messagesSent
    };

    if (parsed.payload !== parsed.message) {
      response.payload = parsed.payload;
    }

    socket.send(JSON.stringify(response));
  });

  socket.on('close', () => {
    console.log('[WS] client disconnected');
  });

  socket.on('error', (error) => {
    console.error('[WS] socket error:', error.message);
  });
});

wss.on('error', (error) => {
  console.error('[WS] server error:', error.message);
});

console.log(`[WS] Mock WebSocket chat server running on ws://localhost:${PORT}${PATH}`);
