import { app, BrowserWindow, ipcMain, screen, dialog, nativeImage, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import log from 'electron-log/main';
import { initializeExecutionEngine } from './core/executionEngine';
import { existsSync } from 'node:fs';
import { validateLicense, getEmbeddedPublicKey, getRevokedLicenses, setRevokedLicenses, revokeLicense } from './main/license';


// These are injected by Electron Forge Vite plugin
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Side-effect import to ensure runnerEngine is bundled by Vite
import './core/runnerEngine';

console.log('[MAIN] Application starting...');
log.initialize({ includeFutureSessions: true });

// OAuth callback handling
const oauthCallbackListeners = new Map<string, (url: string) => void>();

function setupOAuthCallback() {
  // Set up custom protocol for OAuth callback
  if (process.defaultApp && process.argv[1].indexOf('--') === -1) {
    // Development mode - set up protocol handler
    app.setAsDefaultProtocolClient('hailstorm');
  } else {
    app.setAsDefaultProtocolClient('hailstorm');
  }

  app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('[MAIN] OAuth callback received:', url);
    handleOAuthCallback(url);
  });
}

function handleOAuthCallback(url: string) {
  const parsedUrl = new URL(url);
  const code = parsedUrl.searchParams.get('code');
  const state = parsedUrl.searchParams.get('state');
  const error = parsedUrl.searchParams.get('error');

  if (code && state) {
    // Send to renderer via IPC
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length > 0) {
      allWindows[0].webContents.send('oauth-callback', { code, state, error });
    }
  }
}

if (started) {
  console.log('[MAIN] Squirrel startup detected, quitting...');
  app.quit();
}

// Initialize core execution engine
initializeExecutionEngine();

let devToolsEnabled = false;
let mainWindow: BrowserWindow | null = null;
let logLevel: import('./types').LogLevel = 'info';
let currentLicensee: string | null = null;

function updateWindowTitle() {
  if (!mainWindow) return;
  const baseTitle = 'Hailstorm - API Client';
  if (currentLicensee) {
    mainWindow.setTitle(`${baseTitle} (licensed to ${currentLicensee})`);
  } else {
    mainWindow.setTitle(`${baseTitle} (trial/unlicensed)`);
  }
}

function setLicensee(licensee: string | null) {
  currentLicensee = licensee;
  updateWindowTitle();
}

function setLogLevel(level: import('./types').LogLevel) {
  logLevel = level;
  log.level = level;
}

function setDevToolsEnabled(enabled: boolean) {
  if (!mainWindow) return;

  if (enabled) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.webContents.closeDevTools();
  }
}

function createWindow() {
  console.log('[MAIN] Creating main window...');
  console.log('[MAIN] App path:', app.getAppPath());
  console.log('[MAIN] Current dir:', process.cwd());
  
  // Set dock icon on macOS (must happen in ready event, after app.isPackaged is available)
  if (process.platform === 'darwin') {
  const iconPath = path.join(app.getAppPath(), 'build/hailstorm.png');
    if (existsSync(iconPath)) {
      try {
        const image = nativeImage.createFromPath(iconPath);
        if (!image.isEmpty()) {
          app.dock?.setIcon(image);
          console.log('[MAIN] Dock icon set');
        } else {
          console.log('[MAIN] Dock icon image is empty');
        }
      } catch (e) {
        console.log('[MAIN] Could not load dock icon:', e);
      }
    }
  }
  
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const iconPath = path.resolve(app.getAppPath(), 'build/hailstorm.png');
  console.log('[MAIN] Icon path:', iconPath, 'exists:', existsSync(iconPath));
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.maximize();

  // Capture console messages from renderer
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    mainWindow?.webContents.send('console-log', {
      level,
      message,
      line,
      sourceId,
      timestamp: Date.now()
    });
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Update window title after window is created
  updateWindowTitle();
}

ipcMain.handle('get-dev-tools-enabled', () => devToolsEnabled);

  ipcMain.handle('set-dev-tools-enabled', (_event, enabled: boolean) => {
    devToolsEnabled = Boolean(enabled);
    setDevToolsEnabled(devToolsEnabled);
    return devToolsEnabled;
  });

  ipcMain.handle('get-log-level', () => logLevel);

  ipcMain.handle('set-log-level', (_event, level: import('./types').LogLevel) => {
    setLogLevel(level);
    return logLevel;
  });

  ipcMain.handle('open-dev-tools', () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

ipcMain.handle('send-console-log', (_event, log: { level: number; message: string; line: number; sourceId: string }) => {
     if (mainWindow) {
       mainWindow.webContents.send('console-log', {
         ...log,
         timestamp: Date.now()
       });
     }
   });

ipcMain.handle('get-home-directory', () => {
      return app.getPath('home');
    });

  // License validation IPC handlers
  ipcMain.handle('validate-license', (_event, licenseKey: string) => {
    return validateLicense(licenseKey);
  });

  ipcMain.handle('get-embedded-public-key', () => {
    return getEmbeddedPublicKey();
  });

  ipcMain.handle('set-licensee', (_event, licensee: string | null) => {
    setLicensee(licensee);
    return true;
  });

  // License revocation IPC handlers
  ipcMain.handle('get-revoked-licenses', () => {
    return getRevokedLicenses();
  });

  ipcMain.handle('set-revoked-licenses', (_event, list: Record<string, string>) => {
    setRevokedLicenses(list);
    return true;
  });

  ipcMain.handle('revoke-license', (_event, licenseId: string, reason?: string) => {
    revokeLicense(licenseId, reason);
    return true;
  });

// Set up OAuth callback before app is ready
setupOAuthCallback();

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

// Handle second instance (when OAuth callback opens app)
app.on('second-instance', (_event, argv) => {
  const url = argv.find(arg => arg.startsWith('hailstorm://'));
  if (url) {
    handleOAuthCallback(url);
  }
  
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length > 0) {
    allWindows[0].focus();
  }
});
