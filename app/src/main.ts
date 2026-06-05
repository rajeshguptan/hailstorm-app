import { app, BrowserWindow, ipcMain, screen, dialog, nativeImage } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initializeExecutionEngine } from './core/executionEngine';
import { existsSync } from 'node:fs';

// Side-effect import to ensure runnerEngine is bundled by Vite
import './core/runnerEngine';

console.log('[MAIN] Application starting...');

if (started) {
  console.log('[MAIN] Squirrel startup detected, quitting...');
  app.quit();
}

// Initialize core execution engine
initializeExecutionEngine();

// Set dock icon on macOS
if (process.platform === 'darwin') {
  const iconPath = path.join(app.getAppPath(), 'build/icon.png');
  if (existsSync(iconPath)) {
    try {
      const image = nativeImage.createFromPath(iconPath);
      if (!image.isEmpty()) {
        app.dock?.setIcon(image);
        console.log('[MAIN] Dock icon set');
      }
    } catch (e) {
      console.log('[MAIN] Could not load dock icon:', e);
    }
  }
}

function createWindow() {
  console.log('[MAIN] Creating main window...');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const iconPath = path.resolve(app.getAppPath(), 'build/icon.png');
  console.log('[MAIN] Icon path:', iconPath, 'exists:', existsSync(iconPath));
  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
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
