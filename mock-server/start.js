const { spawn } = require('child_process');

const services = [
  { name: 'Mock API server', script: 'server.js' },
  { name: 'Mock WebSocket chat server', script: 'websocket-server.js' }
];

const children = services.map((service) => {
  const child = spawn(process.execPath, [service.script], { stdio: 'inherit' });
  child.serviceName = service.name;

  child.on('error', (error) => {
    console.error(`[STARTER] Failed to start ${service.name}: ${error.message}`);
  });

  return child;
});

let shuttingDown = false;

function stopChildren() {
  return Promise.all(children.map((child) => new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    const forceExit = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
      resolve();
    }, 5000);

    child.once('exit', () => {
      clearTimeout(forceExit);
      resolve();
    });

    child.kill('SIGTERM');
  })));
}

function shutdown(code) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopChildren().then(() => {
    process.exit(code ?? 0);
  });
}

children.forEach((child) => {
  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`[STARTER] ${child.serviceName} exited with ${signal || `code ${code}`}`);

    Promise.all(children
      .filter((other) => other !== child)
      .map((other) => new Promise((resolve) => {
        if (other.exitCode !== null || other.signalCode !== null) {
          resolve();
          return;
        }

        const forceExit = setTimeout(() => {
          if (other.exitCode === null && other.signalCode === null) {
            other.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        other.once('exit', () => {
          clearTimeout(forceExit);
          resolve();
        });

        other.kill('SIGTERM');
      })))
      .then(() => {
        process.exit(code ?? 1);
      });
  });
});

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
