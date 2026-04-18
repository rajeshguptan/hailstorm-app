import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initializeExecutionEngine } from './core/executionEngine';

console.log('[MAIN] Application starting...');

if (started) {
  console.log('[MAIN] Squirrel startup detected, quitting...');
  app.quit();
}

// Initialize core execution engine
initializeExecutionEngine();

function createWindow() {
  console.log('[MAIN] Creating main window...');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
    },
  });
  
  mainWindow.maximize();

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
  createWindow();
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
