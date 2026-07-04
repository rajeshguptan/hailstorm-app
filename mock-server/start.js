const { spawn } = require('child_process');

const child = spawn(process.execPath, ['server.js'], { stdio: 'inherit' });

child.on('error', (error) => {
  console.error(`[STARTER] Failed to start mock server: ${error.message}`);
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  child.kill('SIGTERM');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});