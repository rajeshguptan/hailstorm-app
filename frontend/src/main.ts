import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

console.log('[MAIN] Application starting...');

if (started) {
  console.log('[MAIN] Squirrel startup detected, quitting...');
  app.quit();
}

let backendProcess: ReturnType<typeof spawn> | null = null;

function startBackend() {
  console.log('[MAIN] Starting backend server...');
  const isDev = process.env.NODE_ENV === 'development' || !!process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL;
  console.log('[MAIN] Is development mode:', isDev);
  
  if (isDev) {
    console.log('[MAIN] Starting backend with npm run dev...');
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../../backend'),
      shell: true,
      stdio: 'inherit',
    });
  } else {
    console.log('[MAIN] Starting backend with node dist/index.js...');
    backendProcess = spawn('node', ['dist/index.js'], {
      cwd: path.join(__dirname, '../../backend'),
      shell: true,
      stdio: 'inherit',
    });
  }

  backendProcess.on('error', (err) => {
    console.error('[MAIN] Failed to start backend:', err);
  });
  
  backendProcess.on('exit', (code) => {
    console.log('[MAIN] Backend process exited with code:', code);
  });
}

function createWindow() {
  console.log('[MAIN] Creating main window...');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.openDevTools();
}

app.on('ready', () => {
  startBackend();
  
  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
