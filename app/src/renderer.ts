import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './index.css';
import App from './App.vue';
import { useAppStore } from './stores';
import { useUIStore } from './stores/ui';

const app = createApp(App);
const pinia = createPinia();

// Expose pinia globally for testing access
(app as any).__VUEPINIA__ = pinia;

app.use(pinia);

// Set up console capture right after pinia is active
const store = useAppStore();
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  table: console.table ? console.table.bind(console) : undefined
};

function formatConsoleValue(value: any): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function formatConsoleArgs(args: any[]): string {
  return args.map(formatConsoleValue).join(' ');
}

function captureConsole(type: 'log' | 'info' | 'warn' | 'error' | 'debug', args: any[]) {
  originalConsole[type](...args);
  store.addConsoleLog(formatConsoleArgs(args), type);
}

console.log = (...args: any[]) => captureConsole('log', args);
console.info = (...args: any[]) => captureConsole('info', args);
console.warn = (...args: any[]) => captureConsole('warn', args);
console.error = (...args: any[]) => captureConsole('error', args);
console.debug = (...args: any[]) => captureConsole('debug', args);

if (originalConsole.table) {
  console.table = (...args: any[]) => {
    originalConsole.table!(...args);
    store.addConsoleLog(`table ${formatConsoleArgs(args)}`, 'log');
  };
}

window.addEventListener('error', (event) => {
  const message = event.error ? formatConsoleValue(event.error) : event.message;
  originalConsole.error(message);
  store.addConsoleLog(message, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? formatConsoleValue(event.reason) : formatConsoleValue(event.reason);
  originalConsole.error(message);
  store.addConsoleLog(message, 'error');
});

app.use(router);

const uiStore = useUIStore();
uiStore.setHoveredTreeItem('');

router.isReady().then(() => {
  // App initialized
});

app.mount('#app');
