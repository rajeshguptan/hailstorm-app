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

console.log = (...args: any[]) => {
  store.addConsoleLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'log');
};

console.info = (...args: any[]) => {
  store.addConsoleLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'info');
};

console.warn = (...args: any[]) => {
  store.addConsoleLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'warn');
};

console.error = (...args: any[]) => {
  store.addConsoleLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'error');
};

console.debug = (...args: any[]) => {
  store.addConsoleLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'debug');
};

app.use(router);

const uiStore = useUIStore();
uiStore.setHoveredTreeItem('');

router.isReady().then(() => {
  // App initialized
});

app.mount('#app');
