const crypto = require('crypto');
const { now } = require('../utils/helpers');

function attachEchoSocket(socket, path) {
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

function createChatHandler(wss) {
  return (socket, req) => {
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
        path: '/ws/chat',
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
  };
}

function handleConnection(socket, req, wss) {
  if (socket.mockPath === '/ws/chat') {
    createChatHandler(wss)(socket, req);
    return;
  }

  attachEchoSocket(socket, socket.mockPath || '/ws');
}

module.exports = {
  attachEchoSocket,
  createChatHandler,
  handleConnection
};