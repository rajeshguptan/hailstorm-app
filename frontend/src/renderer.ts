import './index.css';

const DEBUG = true;

function debug(...args: unknown[]) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }
}

debug('Renderer initializing...');

interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  active: boolean;
}

interface Script {
  exec: string[];
}

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Header[];
  body: { type: string; content: string };
  preRequestScript?: Script;
  testScript?: Script;
}

interface Folder {
  id: string;
  name: string;
  items: (Request | Folder)[];
}

interface Collection {
  id: string;
  name: string;
  items: (Request | Folder)[];
  variables: Variable[];
}

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface Tab {
  id: string;
  requestId: string;
  request: Request;
  response?: ResponseData;
  isLoading: boolean;
}

interface HistoryItem {
  id: number;
  method: string;
  url: string;
  status: number;
  time: number;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: string;
  time: number;
  error?: string;
}

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

let collections: Collection[] = [];
let environments: Environment[] = [];
let activeEnvironmentId: string | null = null;
let tabs: Tab[] = [];
let activeTabId: string | null = null;
let history: HistoryItem[] = [];
let historyId = 0;
let tabIdCounter = 0;
let collectionIdCounter = 0;
let folderIdCounter = 0;
let requestIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createRequest(name: string = 'New Request'): Request {
  return {
    id: generateId('req'),
    name,
    method: 'GET',
    url: '',
    headers: [],
    body: { type: 'none', content: '' },
  };
}

function createFolder(name: string = 'New Folder'): Folder {
  return {
    id: generateId('folder'),
    name,
    items: [],
  };
}

function createCollection(name: string = 'New Collection'): Collection {
  return {
    id: generateId('coll'),
    name,
    items: [],
    variables: [],
  };
}

function createEnvironment(name: string = 'New Environment'): Environment {
  return {
    id: generateId('env'),
    name,
    variables: [],
    active: false,
  };
}

function substituteVariables(text: string): string {
  if (!text) return text;
  
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);
  if (!activeEnv) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const variable = activeEnv.variables.find(v => v.key === varName && v.enabled);
    return variable ? variable.value : match;
  });
}

function substituteCollectionVariables(text: string, collection: Collection): string {
  if (!text) return text;
  
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const variable = collection.variables.find(v => v.key === varName && v.enabled);
    return variable ? variable.value : match;
  });
}

function executeScript(script: Script | undefined, context: Record<string, unknown>): string {
  if (!script || !script.exec || script.exec.length === 0) return '';
  
  const code = script.exec.join('\n');
  try {
    const sandbox = {
      pm: {
        environment: {
          get: (key: string) => {
            const activeEnv = environments.find(e => e.id === activeEnvironmentId);
            return activeEnv?.variables.find(v => v.key === key && v.enabled)?.value;
          },
          set: (key: string, value: string) => {
            const activeEnv = environments.find(e => e.id === activeEnvironmentId);
            if (activeEnv) {
              const existing = activeEnv.variables.find(v => v.key === key);
              if (existing) {
                existing.value = value;
              } else {
                activeEnv.variables.push({ key, value, enabled: true });
              }
            }
          },
          toObject: () => {
            const activeEnv = environments.find(e => e.id === activeEnvironmentId);
            if (!activeEnv) return {};
            const obj: Record<string, string> = {};
            activeEnv.variables.filter(v => v.enabled).forEach(v => {
              obj[v.key] = v.value;
            });
            return obj;
          }
        },
        collection: {
          variables: context['collectionVariables'] || {}
        },
        request: {
          name: context['requestName'] || '',
          method: context['requestMethod'] || '',
          url: context['requestUrl'] || ''
        },
        response: context['response'] || null
      },
      console: {
        log: (...args: unknown[]) => console.log('[Script]', ...args)
      },
      JSON,
      Math,
      Date,
    };
    
    const fn = new Function(...Object.keys(sandbox), code);
    fn(...Object.values(sandbox));
    return '';
  } catch (error) {
    return `Script Error: ${error}`;
  }
}

function createApp() {
  debug('Creating app...');
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Hailstorm</h2>
      </div>
      <div class="sidebar-tabs">
        <button class="sidebar-tab active" data-sidebar="collections">Collections</button>
        <button class="sidebar-tab" data-sidebar="environments">Environments</button>
        <button class="sidebar-tab" data-sidebar="history">History</button>
      </div>
      <div class="sidebar-content" id="sidebarContent">
        <div class="collections-panel" id="collectionsPanel">
          <div class="panel-actions">
            <button class="action-btn" id="importBtn">Import</button>
            <button class="action-btn" id="newCollectionBtn">+ Collection</button>
          </div>
          <div class="collections-list" id="collectionsList"></div>
        </div>
        <div class="environments-panel" id="environmentsPanel" style="display:none">
          <div class="panel-actions">
            <button class="action-btn" id="newEnvBtn">+ Environment</button>
          </div>
          <div class="environments-list" id="environmentsList"></div>
        </div>
        <div class="history-panel" id="historyPanel" style="display:none">
          <div class="history-list" id="historyList">
            <div class="history-empty">No requests yet</div>
          </div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="tabs-bar" id="tabsBar">
        <div class="tabs-list" id="tabsList"></div>
        <button class="new-tab-btn" id="newTabBtn">+</button>
      </div>
      <div class="request-panel" id="requestPanel">
        <div class="url-bar">
          <select id="method" class="method-select">
            ${DEFAULT_METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
          <input type="text" id="url" class="url-input" placeholder="Enter request URL" />
          <button id="sendBtn" class="send-btn">Send</button>
          <button id="saveBtn" class="save-btn">Save</button>
        </div>
        <div class="request-name-row">
          <input type="text" id="requestName" class="request-name-input" placeholder="Request Name" />
          <select id="environmentSelect" class="env-select">
            <option value="">No Environment</option>
          </select>
        </div>
        <div class="request-tabs">
          <button class="tab-btn active" data-tab="params">Params</button>
          <button class="tab-btn" data-tab="headers">Headers</button>
          <button class="tab-btn" data-tab="body">Body</button>
          <button class="tab-btn" data-tab="scripts">Scripts</button>
        </div>
        <div class="tab-content active" id="tab-params">
          <div class="key-value-editor" id="paramsEditor">
            <div class="key-value-header">
              <span>Key</span>
              <span>Value</span>
              <span></span>
            </div>
            <div class="key-value-row" data-id="0">
              <input type="text" placeholder="Key" class="param-key" />
              <input type="text" placeholder="Value" class="param-value" />
              <button class="remove-row">×</button>
            </div>
          </div>
          <button class="add-row-btn" id="addParamBtn">+ Add Parameter</button>
        </div>
        <div class="tab-content" id="tab-headers">
          <div class="key-value-editor" id="headersEditor">
            <div class="key-value-header">
              <span>Key</span>
              <span>Value</span>
              <span></span>
            </div>
            <div class="key-value-row" data-id="0">
              <input type="text" placeholder="Key" class="header-key" />
              <input type="text" placeholder="Value" class="header-value" />
              <button class="remove-row">×</button>
            </div>
          </div>
          <button class="add-row-btn" id="addHeaderBtn">+ Add Header</button>
        </div>
        <div class="tab-content" id="tab-body">
          <div class="body-type-selector">
            <label><input type="radio" name="bodyType" value="none" checked /> None</label>
            <label><input type="radio" name="bodyType" value="json" /> JSON</label>
            <label><input type="radio" name="bodyType" value="text" /> Text</label>
          </div>
          <textarea id="bodyEditor" class="body-editor" placeholder='{"key": "value"}' disabled></textarea>
        </div>
        <div class="tab-content" id="tab-scripts">
          <div class="script-section">
            <h4>Pre-request Script</h4>
            <textarea id="preScriptEditor" class="script-editor" placeholder="// Runs before request is sent"></textarea>
          </div>
          <div class="script-section">
            <h4>Test Script</h4>
            <textarea id="testScriptEditor" class="script-editor" placeholder="// Runs after response is received&#10;pm.test('Status is 200', () => {&#10;  pm.response.to.have.status(200);&#10;});"></textarea>
          </div>
        </div>
      </div>
      <div class="response-panel">
        <div class="response-status" id="responseStatus">
          <span class="status-label">Ready to send request</span>
        </div>
        <div class="response-tabs">
          <button class="tab-btn active" data-tab="response-body">Body</button>
          <button class="tab-btn" data-tab="response-headers">Headers</button>
          <button class="tab-btn" data-tab="response-tests">Tests</button>
          <button class="tab-btn" data-tab="response-console">Console</button>
        </div>
        <div class="tab-content active" id="tab-response-body">
          <pre id="responseBody" class="response-body">Response will appear here</pre>
        </div>
        <div class="tab-content" id="tab-response-headers">
          <pre id="responseHeaders" class="response-headers">Response headers will appear here</pre>
        </div>
        <div class="tab-content" id="tab-response-tests">
          <pre id="responseTests" class="response-tests">Test results will appear here</pre>
        </div>
        <div class="tab-content" id="tab-response-console">
          <pre id="responseConsole" class="response-console">Console output will appear here</pre>
        </div>
      </div>
    </div>
    <input type="file" id="fileInput" accept=".json" style="display:none" />
  `;

  setupEventListeners();
  addNewTab();
  updateEnvironmentsSelect();
}

function setupEventListeners() {
  debug('Setting up event listeners...');
  document.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const sidebar = target.dataset.sidebar;
      switchSidebar(sidebar);
    });
  });

  document.getElementById('newCollectionBtn')?.addEventListener('click', () => {
    const collection = createCollection();
    collections.push(collection);
    saveToLocalStorage();
    renderCollections();
  });

  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('fileInput')?.click();
  });

  document.getElementById('fileInput')?.addEventListener('change', handleFileImport);

  document.getElementById('newEnvBtn')?.addEventListener('click', () => {
    const env = createEnvironment();
    environments.push(env);
    saveToLocalStorage();
    renderEnvironments();
    updateEnvironmentsSelect();
  });

  document.getElementById('environmentSelect')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    activeEnvironmentId = target.value || null;
    environments.forEach(env => env.active = env.id === activeEnvironmentId);
    saveToLocalStorage();
  });

  document.getElementById('newTabBtn')?.addEventListener('click', () => {
    addNewTab();
  });

  document.getElementById('sendBtn')?.addEventListener('click', sendRequest);
  document.getElementById('saveBtn')?.addEventListener('click', saveCurrentRequest);

  document.querySelectorAll('#requestPanel .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tab = target.dataset.tab;
      switchTabContent(tab!);
    });
  });

  document.querySelectorAll('.response-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tab = target.dataset.tab;
      switchTabContent(tab!);
    });
  });

  document.getElementById('addParamBtn')?.addEventListener('click', () => addKeyValueRow('paramsEditor', 'param'));
  document.getElementById('addHeaderBtn')?.addEventListener('click', () => addKeyValueRow('headersEditor', 'header'));

  document.querySelectorAll('.remove-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('.key-value-row') as HTMLElement;
      if (row && document.querySelectorAll('.key-value-row').length > 1) {
        row.remove();
      }
    });
  });

  document.getElementsByName('bodyType').forEach(radio => {
    radio.addEventListener('change', () => {
      const bodyEditor = document.getElementById('bodyEditor') as HTMLTextAreaElement;
      if (bodyEditor) bodyEditor.disabled = (radio as HTMLInputElement).value === 'none';
    });
  });

  document.getElementById('method')?.addEventListener('change', updateCurrentTabFromUI);
  document.getElementById('url')?.addEventListener('input', updateCurrentTabFromUI);
  document.getElementById('requestName')?.addEventListener('input', updateCurrentTabFromUI);

  renderCollections();
  renderEnvironments();
  renderHistory();
}

function switchSidebar(sidebar: string) {
  document.querySelectorAll('.sidebar-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-sidebar="${sidebar}"]`)?.classList.add('active');

  document.getElementById('collectionsPanel')!.style.display = sidebar === 'collections' ? 'block' : 'none';
  document.getElementById('environmentsPanel')!.style.display = sidebar === 'environments' ? 'block' : 'none';
  document.getElementById('historyPanel')!.style.display = sidebar === 'history' ? 'block' : 'none';
}

function switchTabContent(tab: string) {
  const panel = document.querySelector('.request-panel, .response-panel')?.closest('.main-content') 
    ? document.querySelector('.request-panel') 
    : document.querySelector('.response-panel');

  const isRequestTab = document.getElementById(`tab-${tab}`)?.closest('.request-panel');

  if (isRequestTab) {
    document.querySelectorAll('.request-panel .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.request-panel .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.request-panel .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
    document.getElementById(`tab-${tab}`)?.classList.add('active');
  } else {
    document.querySelectorAll('.response-panel .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.response-panel .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.response-panel .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
    document.getElementById(`tab-${tab}`)?.classList.add('active');
  }
}

function handleFileImport(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      
      if (data.info && data.item) {
        importPostmanCollection(data);
      } else if (data.values) {
        importPostmanEnvironment(data);
      } else {
        alert('Unrecognized format. Please import a Postman collection or environment.');
      }
    } catch (error) {
      alert('Failed to parse JSON: ' + error);
    }
  };
  reader.readAsText(file);
  target.value = '';
}

function importPostmanCollection(data: any) {
  debug('importPostmanCollection: Importing collection...', { name: data.info?.name });
  const collection: Collection = {
    id: generateId('coll'),
    name: data.info?.name || 'Imported Collection',
    items: [],
    variables: (data.variable || []).map((v: any) => ({
      key: v.key,
      value: v.value,
      enabled: true
    }))
  };

  function convertItem(item: any): Request | Folder {
    if (item.request) {
      return {
        id: generateId('req'),
        name: item.name || 'Request',
        method: item.request.method || 'GET',
        url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
        headers: (item.request.header || []).map((h: any) => ({
          key: h.key,
          value: h.value,
          enabled: true
        })),
        body: {
          type: item.request.body?.mode || 'none',
          content: item.request.body?.raw || ''
        },
        preRequestScript: item.event?.find((e: any) => e.listen === 'prerequest')?.script,
        testScript: item.event?.find((e: any) => e.listen === 'test')?.script
      };
    } else if (item.item) {
      return {
        id: generateId('folder'),
        name: item.name || 'Folder',
        items: item.item.map(convertItem)
      } as Folder;
    }
    return createRequest(item.name);
  }

  collection.items = data.item.map(convertItem);
  collections.push(collection);
  saveToLocalStorage();
  renderCollections();
}

function importPostmanEnvironment(data: any) {
  const env: Environment = {
    id: generateId('env'),
    name: data.name || 'Imported Environment',
    variables: (data.values || []).map((v: any) => ({
      key: v.key,
      value: v.value,
      enabled: !v.disabled
    })),
    active: false
  };
  environments.push(env);
  saveToLocalStorage();
  renderEnvironments();
  updateEnvironmentsSelect();
}

function addNewTab(request?: Request) {
  debug('Adding new tab...', request ? `with request: ${request.name}` : 'empty tab');
  const req = request || createRequest();
  const tab: Tab = {
    id: generateId('tab'),
    requestId: req.id,
    request: req,
    isLoading: false
  };
  tabs.push(tab);
  activeTabId = tab.id;
  renderTabs();
  loadTabToUI(tab);
}

function closeTab(tabId: string) {
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  tabs.splice(index, 1);

  if (tabs.length === 0) {
    addNewTab();
  } else if (activeTabId === tabId) {
    activeTabId = tabs[Math.min(index, tabs.length - 1)].id;
    loadTabToUI(tabs.find(t => t.id === activeTabId)!);
  }

  renderTabs();
}

function renderTabs() {
  debug('renderTabs: Rendering tabs...', { count: tabs.length, activeTabId });
  const tabsList = document.getElementById('tabsList');
  if (!tabsList) return;

  tabsList.innerHTML = tabs.map(tab => `
    <div class="tab ${tab.id === activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
      <span class="tab-method method-${tab.request.method.toLowerCase()}">${tab.request.method}</span>
      <span class="tab-name">${tab.request.name || 'Untitled'}</span>
      <button class="tab-close" data-tab-id="${tab.id}">×</button>
    </div>
  `).join('');

  tabsList.querySelectorAll('.tab').forEach(tabEl => {
    tabEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('tab-close')) {
        e.stopPropagation();
        closeTab(target.dataset.tabId!);
      } else {
        const tabId = (tabEl as HTMLElement).dataset.tabId!;
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          activeTabId = tabId;
          renderTabs();
          loadTabToUI(tab);
        }
      }
    });
  });
}

function loadTabToUI(tab: Tab) {
  debug('loadTabToUI: Loading tab to UI', { tabId: tab.id, requestName: tab.request.name, method: tab.request.method });
  const methodSelect = document.getElementById('method') as HTMLSelectElement;
  const urlInput = document.getElementById('url') as HTMLInputElement;
  const nameInput = document.getElementById('requestName') as HTMLInputElement;
  const bodyEditor = document.getElementById('bodyEditor') as HTMLTextAreaElement;
  const preScriptEditor = document.getElementById('preScriptEditor') as HTMLTextAreaElement;
  const testScriptEditor = document.getElementById('testScriptEditor') as HTMLTextAreaElement;

  if (methodSelect) methodSelect.value = tab.request.method;
  if (urlInput) urlInput.value = tab.request.url;
  if (nameInput) nameInput.value = tab.request.name;
  if (bodyEditor) {
    bodyEditor.value = tab.request.body.content;
    const bodyType = tab.request.body.type;
    (document.querySelector(`input[name="bodyType"][value="${bodyType}"]`) as HTMLInputElement)?.click();
  }
  if (preScriptEditor) preScriptEditor.value = tab.request.preRequestScript?.exec?.join('\n') || '';
  if (testScriptEditor) testScriptEditor.value = tab.request.testScript?.exec?.join('\n') || '';

  renderKeyValueRows('paramsEditor', 'param', tab.request.url);
  renderKeyValueRows('headersEditor', 'header', undefined, tab.request.headers);

  renderResponse(tab.response);
}

function updateCurrentTabFromUI() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;

  const methodSelect = document.getElementById('method') as HTMLSelectElement;
  const urlInput = document.getElementById('url') as HTMLInputElement;
  const nameInput = document.getElementById('requestName') as HTMLInputElement;
  const bodyEditor = document.getElementById('bodyEditor') as HTMLTextAreaElement;
  const preScriptEditor = document.getElementById('preScriptEditor') as HTMLTextAreaElement;
  const testScriptEditor = document.getElementById('testScriptEditor') as HTMLTextAreaElement;
  const bodyType = (document.querySelector('input[name="bodyType"]:checked') as HTMLInputElement)?.value || 'none';

  tab.request.method = methodSelect?.value || 'GET';
  tab.request.url = urlInput?.value || '';
  tab.request.name = nameInput?.value || '';
  tab.request.body = { type: bodyType, content: bodyEditor?.value || '' };
  tab.request.headers = getKeyValuePairs('headersEditor', 'header');

  if (preScriptEditor?.value) {
    tab.request.preRequestScript = { exec: preScriptEditor.value.split('\n') };
  } else {
    delete tab.request.preRequestScript;
  }

  if (testScriptEditor?.value) {
    tab.request.testScript = { exec: testScriptEditor.value.split('\n') };
  } else {
    delete tab.request.testScript;
  }

  renderTabs();
}

function renderKeyValueRows(containerId: string, prefix: string, url?: string, existingHeaders?: Header[]) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="key-value-header">
      <span>Key</span>
      <span>Value</span>
      <span></span>
    </div>
  `;

  if (containerId === 'paramsEditor' && url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : 'http://' + url);
      urlObj.searchParams.forEach((value, key) => {
        addKeyValueRow(containerId, prefix, key, value);
      });
    } catch {}
  }

  if (existingHeaders) {
    existingHeaders.forEach(h => addKeyValueRow(containerId, prefix, h.key, h.value));
  } else if (container.querySelectorAll('.key-value-row').length === 0) {
    addKeyValueRow(containerId, prefix);
  }

  container.querySelectorAll('.key-value-row').forEach(row => {
    row.querySelector('.remove-row')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const rowEl = target.closest('.key-value-row') as HTMLElement;
      if (rowEl && document.querySelectorAll('.key-value-row').length > 1) {
        rowEl.remove();
      }
    });
  });
}

function addKeyValueRow(containerId: string, prefix: string, key: string = '', value: string = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'key-value-row';
  row.innerHTML = `
    <input type="text" placeholder="Key" class="${prefix}-key" value="${key}" />
    <input type="text" placeholder="Value" class="${prefix}-value" value="${value}" />
    <button class="remove-row">×</button>
  `;

  row.querySelector('.remove-row')?.addEventListener('click', () => {
    if (document.querySelectorAll('.key-value-row').length > 1) {
      row.remove();
    }
  });

  container.appendChild(row);
}

function getKeyValuePairs(containerId: string, prefix: string): Header[] {
  const container = document.getElementById(containerId);
  if (!container) return [];

  const rows = container.querySelectorAll('.key-value-row');
  const headers: Header[] = [];

  rows.forEach(row => {
    const keyInput = row.querySelector(`.${prefix}-key`) as HTMLInputElement;
    const valueInput = row.querySelector(`.${prefix}-value`) as HTMLInputElement;
    if (keyInput?.value && valueInput?.value) {
      headers.push({ key: keyInput.value, value: valueInput.value, enabled: true });
    }
  });

  return headers;
}

function buildUrlWithParams(baseUrl: string, params: Header[]): string {
  if (params.length === 0) return baseUrl;

  try {
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : 'http://' + baseUrl);
    params.forEach(param => {
      url.searchParams.append(param.key, param.value);
    });
    return url.toString();
  } catch {
    return baseUrl;
  }
}

let consoleOutput: string[] = [];

function logConsole(message: string) {
  consoleOutput.push(message);
}

async function sendRequest() {
  debug('sendRequest: Starting request...');
  updateCurrentTabFromUI();

  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) {
    debug('sendRequest: No active tab found');
    return;
  }

  debug('sendRequest: Tab found', { method: tab.request.method, url: tab.request.url });

  let url = tab.request.url.trim();
  if (!url) {
    alert('Please enter a URL');
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  debug('sendRequest: Final URL:', url);

  let collection: Collection | undefined;
  for (const coll of collections) {
    const found = findRequestInCollection(coll, tab.request.id);
    if (found) {
      collection = coll;
      break;
    }
  }

  if (collection) {
    url = substituteCollectionVariables(url, collection);
  }
  url = substituteVariables(url);

  const params = getKeyValuePairs('paramsEditor', 'param').map(h => ({
    ...h,
    key: collection ? substituteCollectionVariables(h.key, collection) : h.key,
    value: collection ? substituteCollectionVariables(h.value, collection) : h.value
  }));
  url = buildUrlWithParams(url, params);

  const headers = getKeyValuePairs('headersEditor', 'header').map(h => ({
    ...h,
    key: collection ? substituteCollectionVariables(h.key, collection) : h.key,
    value: collection ? substituteCollectionVariables(h.value, collection) : h.value
  }));

  headers.forEach(h => h.value = substituteVariables(h.value));

  const headersObj: Record<string, string> = {};
  headers.forEach(h => { headersObj[h.key] = h.value; });

  const bodyType = tab.request.body.type;
  let body = bodyType !== 'none' ? tab.request.body.content : undefined;

  if (body && collection) {
    body = substituteCollectionVariables(body, collection);
  }
  if (body) {
    body = substituteVariables(body);
  }

  if (bodyType === 'json' && body) {
    headersObj['Content-Type'] = 'application/json';
  }

  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.textContent = 'Sending...';
    (sendBtn as HTMLButtonElement).disabled = true;
  }

  const responseStatus = document.getElementById('responseStatus');
  const responseBody = document.getElementById('responseBody');
  const responseHeaders = document.getElementById('responseHeaders');
  const responseTests = document.getElementById('responseTests');
  const responseConsole = document.getElementById('responseConsole');

  consoleOutput = [];
  logConsole(`> ${tab.request.method} ${url}`);

  if (responseStatus) responseStatus.innerHTML = '<span class="status-label">Loading...</span>';
  if (responseBody) responseBody.textContent = 'Loading...';
  if (responseHeaders) responseHeaders.textContent = '';
  if (responseTests) responseTests.textContent = '';
  if (responseConsole) responseConsole.textContent = consoleOutput.join('\n');

  const scriptContext: Record<string, unknown> = {
    requestName: tab.request.name,
    requestMethod: tab.request.method,
    requestUrl: url,
    collectionVariables: collection?.variables || {}
  };

  const preResult = executeScript(tab.request.preRequestScript, scriptContext);
  if (preResult) {
    logConsole(preResult);
  }

  try {
    debug('sendRequest: Making API call...', { method: tab.request.method, url, headers: headersObj, body });
    const response = await window.api.makeRequest({
      method: tab.request.method,
      url,
      headers: headersObj,
      body,
    });

    debug('sendRequest: Response received', { status: response.status, statusText: response.statusText, time: response.time });

    scriptContext['response'] = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      text: () => response.data,
      json: () => JSON.parse(response.data)
    };

    const testResult = executeScript(tab.request.testScript, scriptContext);
    if (testResult) {
      logConsole(testResult);
    }

    if (response.error) {
      if (responseStatus) {
        responseStatus.innerHTML = `<span class="status-error">Error: ${response.error}</span>`;
      }
      if (responseBody) responseBody.textContent = response.error;
      logConsole(`< ${response.error}`);
    } else {
      const statusClass = response.status >= 200 && response.status < 300 ? 'status-success' :
                          response.status >= 400 ? 'status-error' : 'status-warning';

      if (responseStatus) {
        responseStatus.innerHTML = `
          <span class="${statusClass}">${response.status} ${response.statusText}</span>
          <span class="status-time">${response.time}ms</span>
        `;
      }

      let formattedBody = response.data;
      try {
        const parsed = JSON.parse(response.data);
        formattedBody = JSON.stringify(parsed, null, 2);
      } catch {}

      if (responseBody) responseBody.textContent = formattedBody || '(empty response)';

      if (responseHeaders) {
        const formattedHeaders = Object.entries(response.headers)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        responseHeaders.textContent = formattedHeaders || '(no headers)';
      }

      logConsole(`< ${response.status} ${response.statusText} (${response.time}ms)`);

      historyId++;
      history.unshift({ id: historyId, method: tab.request.method, url, status: response.status, time: response.time });
      if (history.length > 50) history.pop();
      renderHistory();

      tab.response = response;
    }

    if (responseTests) {
      responseTests.textContent = consoleOutput.filter(l => l.startsWith('✓') || l.startsWith('✗') || l.includes('test')).join('\n') || 'No tests run';
    }

  } catch (error) {
    if (responseStatus) {
      responseStatus.innerHTML = `<span class="status-error">Error: ${error}</span>`;
    }
    if (responseBody) responseBody.textContent = String(error);
    logConsole(`Error: ${error}`);
  } finally {
    if (sendBtn) {
      sendBtn.textContent = 'Send';
      (sendBtn as HTMLButtonElement).disabled = false;
    }
    if (responseConsole) responseConsole.textContent = consoleOutput.join('\n');
  }
}

function findRequestInCollection(collection: Collection, requestId: string): Request | null {
  for (const item of collection.items) {
    if ('method' in item && item.id === requestId) {
      return item;
    }
    if ('items' in item) {
      const found = findRequestInFolder(item as Folder, requestId);
      if (found) return found;
    }
  }
  return null;
}

function findRequestInFolder(folder: Folder, requestId: string): Request | null {
  for (const item of folder.items) {
    if ('method' in item && item.id === requestId) {
      return item;
    }
    if ('items' in item) {
      const found = findRequestInFolder(item as Folder, requestId);
      if (found) return found;
    }
  }
  return null;
}

function renderResponse(response?: { status: number; statusText: string; headers: Record<string, string | string[]>; data: string; time: number }) {
  const responseBody = document.getElementById('responseBody');
  const responseHeaders = document.getElementById('responseHeaders');
  const responseStatus = document.getElementById('responseStatus');

  if (!response) {
    if (responseStatus) responseStatus.innerHTML = '<span class="status-label">Ready to send request</span>';
    if (responseBody) responseBody.textContent = 'Response will appear here';
    if (responseHeaders) responseHeaders.textContent = '';
    return;
  }

  const statusClass = response.status >= 200 && response.status < 300 ? 'status-success' :
                      response.status >= 400 ? 'status-error' : 'status-warning';

  if (responseStatus) {
    responseStatus.innerHTML = `
      <span class="${statusClass}">${response.status} ${response.statusText}</span>
      <span class="status-time">${response.time}ms</span>
    `;
  }

  let formattedBody = response.data;
  try {
    const parsed = JSON.parse(response.data);
    formattedBody = JSON.stringify(parsed, null, 2);
  } catch {}

  if (responseBody) responseBody.textContent = formattedBody || '(empty response)';

  if (responseHeaders) {
    const formattedHeaders = Object.entries(response.headers)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');
    responseHeaders.textContent = formattedHeaders || '(no headers)';
  }
}

function saveCurrentRequest() {
  updateCurrentTabFromUI();
  alert('Request saved to current tab. To save to a collection, right-click on a request in the sidebar.');
}

function renderCollections() {
  debug('renderCollections: Rendering collections...', { count: collections.length });
  const list = document.getElementById('collectionsList');
  if (!list) return;

  if (collections.length === 0) {
    list.innerHTML = '<div class="empty-message">No collections yet</div>';
    return;
  }

  list.innerHTML = collections.map(coll => renderCollectionItem(coll, 0)).join('');

  list.querySelectorAll('.collection-item, .folder-item, .request-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = item as HTMLElement;
      const type = target.dataset.type;
      const id = target.dataset.id;

      if (type === 'request') {
        const existingTab = tabs.find(t => t.requestId === id);
        if (existingTab) {
          activeTabId = existingTab.id;
          renderTabs();
          loadTabToUI(existingTab);
        } else {
          const request = findRequestById(id!);
          if (request) {
            addNewTab({ ...request });
          }
        }
      }
    });

    item.addEventListener('contextmenu', (e) => {
      console.log('Context menu triggered on item:', e.target);
      e.preventDefault();
      const target = item as HTMLElement;
      console.log('Target dataset:', target.dataset);
      showContextMenu(e as MouseEvent, target.dataset.type, target.dataset.id);
    });
  });
}

function renderCollectionItem(item: Collection | Folder | Request, depth: number): string {
  const indent = depth * 16;

  if ('method' in item) {
    return `
      <div class="request-item" data-type="request" data-id="${item.id}" style="padding-left: ${indent}px">
        <span class="item-method method-${item.method.toLowerCase()}">${item.method}</span>
        <span class="item-name">${item.name}</span>
      </div>
    `;
  }

  if ('items' in item) {
    const folder = item as Folder;
    let html = `
      <div class="folder-item" data-type="folder" data-id="${folder.id}" style="padding-left: ${indent}px">
        <span class="folder-icon">📁</span>
        <span class="item-name">${folder.name}</span>
      </div>
    `;
    html += folder.items.map(subItem => renderCollectionItem(subItem, depth + 1)).join('');
    return html;
  }

  const collection = item as Collection;
  return `
    <div class="collection-item" data-type="collection" data-id="${collection.id}">
      <div class="collection-header">
        <span class="collection-icon">📂</span>
        <span class="item-name">${collection.name}</span>
      </div>
      ${collection.items.map(subItem => renderCollectionItem(subItem, 1)).join('')}
    </div>
  `;
}

function findRequestById(id: string): Request | null {
  for (const coll of collections) {
    const found = findRequestInCollection(coll, id);
    if (found) return found;
  }
  return null;
}

function showContextMenu(e: MouseEvent, type: string | undefined, id: string | undefined) {
  debug('showContextMenu: Context menu requested', { type, id });
  if (!type || !id) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  
  document.querySelectorAll('.context-menu').forEach(m => m.remove());
  
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'fixed';
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  
  let menuItems = '';
  if (type === 'collection' || type === 'folder') {
    menuItems += `<div class="context-menu-item" data-action="add-request">Add Request</div>`;
    menuItems += `<div class="context-menu-item" data-action="add-folder">Add Folder</div>`;
  }
  menuItems += `<div class="context-menu-item" data-action="delete">Delete</div>`;
  
  menu.innerHTML = menuItems;

  const closeMenu = () => menu.remove();
  
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      console.log('Menu item clicked');
      e.stopPropagation();
      const action = (item as HTMLElement).dataset.action;
      console.log('Action:', action);
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this item?')) {
          console.log('User cancelled delete');
          return;
        }
        console.log('User confirmed delete');
      }
      handleContextAction(action, type, id);
      closeMenu();
    });
  });
  
  document.body.appendChild(menu);
  
  setTimeout(() => {
    const closeOnClickOutside = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        closeMenu();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 0);
}

function handleContextAction(action: string | undefined, type: string | undefined, id: string | undefined) {
  debug('handleContextAction: Action triggered', { action, type, id });
  if (!action) return;

  if (action === 'add-request') {
    const request = createRequest();
    if (type === 'collection') {
      const coll = collections.find(c => c.id === id);
      if (coll) coll.items.push(request);
    } else if (type === 'folder') {
      addRequestToFolder(id, request);
    }
  } else if (action === 'add-folder') {
    const folder = createFolder();
    if (type === 'collection') {
      const coll = collections.find(c => c.id === id);
      if (coll) coll.items.push(folder);
    } else if (type === 'folder') {
      addFolderToFolder(id, folder);
    }
  } else if (action === 'delete') {
    deleteItem(type, id);
  }

  saveToLocalStorage();
  renderCollections();
}

function addRequestToFolder(folderId: string | undefined, request: Request) {
  for (const coll of collections) {
    if (addRequestToFolderRecursive(coll.items, folderId, request)) return;
  }
}

function addRequestToFolderRecursive(items: (Request | Folder)[], folderId: string | undefined, request: Request): boolean {
  for (const item of items) {
    if ('items' in item && item.id === folderId) {
      item.items.push(request);
      return true;
    }
    if ('items' in item) {
      if (addRequestToFolderRecursive(item.items, folderId, request)) return true;
    }
  }
  return false;
}

function addFolderToFolder(parentFolderId: string | undefined, folder: Folder) {
  for (const coll of collections) {
    if (addFolderToFolderRecursive(coll.items, parentFolderId, folder)) return;
  }
}

function addFolderToFolderRecursive(items: (Request | Folder)[], parentFolderId: string | undefined, folder: Folder): boolean {
  for (const item of items) {
    if ('items' in item && item.id === parentFolderId) {
      item.items.push(folder);
      return true;
    }
    if ('items' in item) {
      if (addFolderToFolderRecursive(item.items, parentFolderId, folder)) return true;
    }
  }
  return false;
}

function deleteItem(type: string | undefined, id: string | undefined) {
  console.log('deleteItem called with:', type, id);
  if (!id || !type) {
    console.log('Invalid params - id:', id, 'type:', type);
    return;
  }

  if (type === 'collection') {
    console.log('Before filter - collections length:', collections.length);
    collections = collections.filter(c => c.id !== id);
    console.log('After filter - collections length:', collections.length);
    console.log('Collections after filter:', collections);
  } else {
    for (const coll of collections) {
      deleteFromItems(coll.items, type, id);
    }
  }
}

function deleteFromItems(items: (Request | Folder)[], type: string | undefined, id: string) {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (type === 'request' && 'method' in item && item.id === id) {
      items.splice(i, 1);
      return;
    }
    if (type === 'folder' && 'items' in item && item.id === id) {
      items.splice(i, 1);
      return;
    }
    if ('items' in item) {
      deleteFromItems(item.items, type, id);
    }
  }
}

function renderEnvironments() {
  debug('renderEnvironments: Rendering environments...', { count: environments.length });
  const list = document.getElementById('environmentsList');
  if (!list) return;

  if (environments.length === 0) {
    list.innerHTML = '<div class="empty-message">No environments yet</div>';
    return;
  }

  list.innerHTML = environments.map(env => `
    <div class="environment-item ${env.id === activeEnvironmentId ? 'active' : ''}" data-env-id="${env.id}">
      <div class="env-header">
        <span class="env-name">${env.name}</span>
        <button class="env-edit-btn" data-env-id="${env.id}">Edit</button>
      </div>
      <div class="env-variables">
        ${env.variables.map(v => `
          <div class="env-var">
            <input type="checkbox" ${v.enabled ? 'checked' : ''} data-var-key="${v.key}" data-env-id="${env.id}" />
            <span class="var-key">${v.key}</span>=<span class="var-value">${v.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.env-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const envId = (e.target as HTMLElement).dataset.envId;
      const env = environments.find(en => en.id === envId);
      if (env) showEnvironmentEditor(env);
    });
  });
}

function showEnvironmentEditor(env: Environment) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Edit Environment</h3>
      <input type="text" class="env-name-input" value="${env.name}" placeholder="Environment Name" />
      <div class="env-vars-editor">
        <div class="key-value-header">
          <span>Variable</span>
          <span>Initial Value</span>
          <span></span>
        </div>
        ${env.variables.map(v => `
          <div class="key-value-row">
            <input type="text" class="var-key" value="${v.key}" placeholder="Key" />
            <input type="text" class="var-value" value="${v.value}" placeholder="Value" />
            <button class="remove-row">×</button>
          </div>
        `).join('')}
        <div class="key-value-row">
          <input type="text" class="var-key" placeholder="Key" />
          <input type="text" class="var-value" placeholder="Value" />
          <button class="remove-row">×</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn cancel">Cancel</button>
        <button class="modal-btn save">Save</button>
      </div>
    </div>
  `;

  modal.querySelector('.cancel')?.addEventListener('click', () => modal.remove());
  modal.querySelector('.save')?.addEventListener('click', () => {
    const nameInput = modal.querySelector('.env-name-input') as HTMLInputElement;
    env.name = nameInput?.value || env.name;

    const rows = modal.querySelectorAll('.env-vars-editor .key-value-row');
    env.variables = [];
    rows.forEach(row => {
      const keyInput = row.querySelector('.var-key') as HTMLInputElement;
      const valueInput = row.querySelector('.var-value') as HTMLInputElement;
      if (keyInput?.value) {
        env.variables.push({ key: keyInput.value, value: valueInput?.value || '', enabled: true });
      }
    });

    saveToLocalStorage();
    renderEnvironments();
    updateEnvironmentsSelect();
    modal.remove();
  });

  modal.querySelector('.add-row-btn')?.addEventListener('click', () => {
    const editor = modal.querySelector('.env-vars-editor');
    const row = document.createElement('div');
    row.className = 'key-value-row';
    row.innerHTML = `
      <input type="text" class="var-key" placeholder="Key" />
      <input type="text" class="var-value" placeholder="Value" />
      <button class="remove-row">×</button>
    `;
    editor?.appendChild(row);
  });

  document.body.appendChild(modal);
}

function updateEnvironmentsSelect() {
  const select = document.getElementById('environmentSelect') as HTMLSelectElement;
  if (!select) return;

  select.innerHTML = '<option value="">No Environment</option>' +
    environments.map(env => `<option value="${env.id}" ${env.id === activeEnvironmentId ? 'selected' : ''}>${env.name}</option>`).join('');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  if (history.length === 0) {
    list.innerHTML = '<div class="history-empty">No requests yet</div>';
    return;
  }

  list.innerHTML = history.map(item => `
    <div class="history-item" data-url="${item.url}" data-method="${item.method}">
      <div class="history-method method-${item.method.toLowerCase()}">${item.method}</div>
      <div class="history-url">${item.url}</div>
      <div class="history-status ${item.status >= 200 && item.status < 300 ? 'success' : item.status >= 400 ? 'error' : ''}">
        ${item.status || 'Error'} · ${item.time}ms
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      const method = item.getAttribute('data-method');
      const newRequest = createRequest();
      newRequest.method = method || 'GET';
      newRequest.url = url || '';
      newRequest.name = 'From History';
      addNewTab(newRequest);
    });
  });
}

function saveToLocalStorage() {
  debug('saveToLocalStorage: Saving data...', { collections: collections.length, environments: environments.length, history: history.length });
  const data = {
    collections,
    environments,
    activeEnvironmentId,
    history
  };
  localStorage.setItem('hailstorm_data', JSON.stringify(data));
}

function loadFromLocalStorage() {
  debug('loadFromLocalStorage: Loading data...');
  const data = localStorage.getItem('hailstorm_data');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      collections = parsed.collections || [];
      environments = parsed.environments || [];
      activeEnvironmentId = parsed.activeEnvironmentId;
      history = parsed.history || [];
    } catch {}
  }
}

loadFromLocalStorage();
debug('Data loaded from localStorage');
document.addEventListener('DOMContentLoaded', () => {
  debug('DOMContentLoaded: Creating app...');
  createApp();
  debug('App created successfully');
});
