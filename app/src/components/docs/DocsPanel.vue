<template>
  <div class="docs-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200" data-testid="docs-panel">
    <header class="docs-hero border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/40 p-6">
      <div class="max-w-6xl mx-auto w-full">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400 mb-3">Hailstorm Docs</p>
            <h1 class="text-3xl md:text-4xl font-bold text-zinc-950 dark:text-white mb-3">Build, automate, and stress-test APIs</h1>
            <p class="text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
              A local-first API client for HTTP, GraphQL, JSON-RPC, WebSocket, shell commands, secrets, environments,
              automated runners, and load testing.
            </p>
          </div>

          <div class="relative w-full md:w-80">
            <label for="docs-search" class="sr-only">Search docs</label>
            <input
              id="docs-search"
              v-model="searchQuery"
              type="search"
              class="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Search docs..."
            />
            <kbd class="pointer-events-none absolute right-3 top-2.5 hidden rounded border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 sm:inline-block">⌘K</kbd>
          </div>
        </div>
      </div>
    </header>

    <div class="docs-layout min-h-0 flex-1 overflow-hidden">
      <aside class="docs-sidebar w-72 flex-shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/30">
        <nav class="p-4 space-y-6" aria-label="Documentation sections">
          <div v-for="category in categories" :key="category.id">
            <button
              class="mb-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              :class="{ 'text-blue-600 dark:text-blue-400': activeCategory === category.id }"
              @click="selectCategory(category.id)"
            >
              {{ category.label }}
            </button>
            <div class="space-y-1">
              <button
                v-for="doc in category.docs"
                :key="doc.title"
                class="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                :class="activeDocId === doc.title ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                @click="selectDoc(doc.title)"
              >
                {{ doc.title }}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <main class="docs-content min-w-0 flex-1 overflow-y-auto p-6">
        <div v-if="visibleDocs.length === 0" class="mx-auto max-w-2xl rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No docs found</h2>
          <p class="text-zinc-500 dark:text-zinc-400">Try a different search term.</p>
        </div>

        <article
          v-for="doc in visibleDocs"
          :key="doc.title"
          class="docs-card scroll-mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm"
        >
          <div class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400 mb-2">{{ doc.categoryLabel }}</p>
            <h2 class="text-2xl font-bold text-zinc-950 dark:text-white">{{ doc.title }}</h2>
            <p class="mt-3 text-zinc-600 dark:text-zinc-400 leading-relaxed">{{ doc.summary }}</p>
          </div>

          <div v-if="doc.steps?.length" class="mb-6 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-700 p-5">
            <ol class="space-y-3">
              <li v-for="(step, index) in doc.steps" :key="step" class="flex gap-3">
                <span class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{{ index + 1 }}</span>
                <span class="text-zinc-700 dark:text-zinc-300">{{ step }}</span>
              </li>
            </ol>
          </div>

          <ul v-if="doc.bullets?.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <li v-for="bullet in doc.bullets" :key="bullet" class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/30 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
              {{ bullet }}
            </li>
          </ul>
        </article>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

interface DocsDoc {
  title: string;
  summary: string;
  bullets: string[];
  steps?: string[];
  tags: string[];
}

interface DocsCategory {
  id: string;
  label: string;
  docs: DocsDoc[];
}

const searchQuery = ref('');
const selectedCategory = ref('getting-started');
const selectedDoc = ref('');

const categories: DocsCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    docs: [
      {
        title: 'Installation',
        summary: 'Install Hailstorm locally and start with a private workspace that does not require an account or cloud sync.',
        tags: ['install', 'download', 'desktop', 'electron'],
        bullets: [
          'Electron desktop application for macOS, Windows, and Linux builds',
          'Local-first workspace with no required sign-in',
          'Developer Tools can be enabled from Settings > Advanced > Developer Tools'
        ]
      },
      {
        title: 'Quick Start',
        summary: 'Create a request, choose an environment, send it, and inspect the response in one workflow.',
        tags: ['quickstart', 'request', 'response', 'send'],
        steps: [
          'Open Collections and create or import a collection.',
          'Add a request and enter the URL, method, headers, body, auth, variables, or scripts.',
          'Choose an active environment and click Send.',
          'Review response body, headers, cookies, timing, and test assertions.'
        ],
        bullets: [
          'Requests auto-save when layout auto-save is enabled',
          'Recent requests appear at the bottom of the Collections view',
          'History stores sent requests for later review'
        ]
      },
      {
        title: 'Workspace Layout',
        summary: 'Hailstorm uses a left ribbon, optional sidebar, request editor, response panel, and full-screen utility views.',
        tags: ['layout', 'ribbon', 'sidebar', 'navigation'],
        bullets: [
          'Ribbon navigation: Collections, History, Secrets, Stats, Runner, Console, Docs, and Settings',
          'Collections, History, Secrets, and Runner use a resizable sidebar',
          'Stats, Console, Settings, and Docs use the full main content area',
          'Sidebar width and request panel height are persisted locally'
        ]
      }
    ]
  },
  {
    id: 'request-types',
    label: 'Request Types',
    docs: [
      {
        title: 'HTTP Requests',
        summary: 'Build REST and HTTP API requests with methods, URL parameters, headers, body editors, auth, variables, and scripts.',
        tags: ['http', 'rest', 'get', 'post', 'headers', 'body'],
        bullets: [
          'Methods include GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, and custom methods',
          'Body types include JSON, form data, URL encoded, raw, binary, and none',
          'Headers, query parameters, and variables are substituted at runtime',
          'Redirect following, timeout, SSL verification, and response size limits are configurable in Settings'
        ]
      },
      {
        title: 'GraphQL Requests',
        summary: 'Create GraphQL POST requests with operation name, variables, and a dedicated query editor.',
        tags: ['graphql', 'query', 'variables', 'operation'],
        bullets: [
          'GraphQL body type switches the editor to query, variables, and operation name fields',
          'Requests use POST by default for GraphQL payloads',
          'Variables, headers, auth, and scripts behave like other request types'
        ]
      },
      {
        title: 'JSON-RPC Requests',
        summary: 'Send JSON-RPC requests as JSON bodies with a clear RPC badge in the collection tree.',
        tags: ['json-rpc', 'rpc', 'json', 'batch'],
        bullets: [
          'JSON-RPC requests are stored as POST requests with JSON body content',
          'Request.isJsonRpc marks the request for collection badges',
          'Use variables and scripts to generate ids, params, and authentication headers'
        ]
      },
      {
        title: 'WebSocket Connections',
        summary: 'Connect to WebSocket endpoints, send JSON, XML, or text messages, and inspect live frames.',
        tags: ['websocket', 'ws', 'socket', 'streaming'],
        bullets: [
          'WebSocket requests use isWebSocket and connect through the WebSocket execution path',
          'Message body types include JSON, XML, and text',
          'Live frames are surfaced through the response and console workflow'
        ]
      },
      {
        title: 'Shell Commands',
        summary: 'Run local shell commands from the request editor when a request method is set to SHELL.',
        tags: ['shell', 'command', 'terminal', 'local'],
        bullets: [
          'Shell requests use method SHELL and the URL field as the command input',
          'The request editor switches to a shell script detail view',
          'Output is handled separately from HTTP response parsing'
        ]
      }
    ]
  },
  {
    id: 'collections',
    label: 'Collections',
    docs: [
      {
        title: 'Collections and Folders',
        summary: 'Organize requests into collections and folders with context-menu actions for everyday API workflows.',
        tags: ['collection', 'folder', 'organize', 'context menu'],
        bullets: [
          'Add HTTP, JSON-RPC, GraphQL, WebSocket, and shell requests',
          'Add folders, duplicate, rename, copy, paste, and delete items',
          'Select a request to open the request editor and response panel',
          'JSON-RPC requests show an RPC badge in the tree'
        ]
      },
      {
        title: 'Import and Export',
        summary: 'Bring existing API definitions into Hailstorm or export completed load test runs as JSON.',
        tags: ['import', 'export', 'postman', 'openapi'],
        bullets: [
          'Import Postman collections from JSON files',
          'Import OpenAPI/Swagger specs and generate requests grouped by tags',
          'Export load test run data from the Stats panel',
          'Collections are stored locally in a JSON-friendly format'
        ]
      },
      {
        title: 'Request Editor',
        summary: 'Configure every part of a request from one editor with tabs for parameters, auth, headers, body, variables, scripts, and description.',
        tags: ['editor', 'parameters', 'scripts', 'description'],
        bullets: [
          'Parameters tab edits query string keys and values',
          'Variables tab supports request-scoped variables with environment targeting',
          'Description tab supports Markdown documentation for requests',
          'Dependencies let one request use data from another request'
        ]
      }
    ]
  },
  {
    id: 'authentication',
    label: 'Authentication',
    docs: [
      {
        title: 'Auth Types',
        summary: 'Apply request-level authentication for common API security schemes.',
        tags: ['auth', 'bearer', 'basic', 'apikey', 'ntlm', 'certificate', 'oauth'],
        bullets: [
          'Bearer token, Basic, NTLM, API key, OAuth 2.0, client certificate, and inherit-from-parent auth',
          'API keys can be sent in headers or query parameters',
          'Client certificates support PKCS#12 and PEM certificate/key pairs',
          'Auth fields participate in variable substitution'
        ]
      },
      {
        title: 'OAuth 2.0',
        summary: 'Configure OAuth 2.0 authorization code flow with PKCE and token storage for authenticated requests.',
        tags: ['oauth2', 'oauth', 'pkce', 'token'],
        bullets: [
          'Authorization URL, token URL, client id, client secret, scope, redirect URI, and PKCE verifier support',
          'Access and refresh tokens are stored and reused by request id',
          'OAuth callback URLs are handled by the Electron main process'
        ]
      },
      {
        title: 'Request Inheritance',
        summary: 'Reuse authentication from a parent collection or folder request to avoid duplicating credentials.',
        tags: ['inherit', 'parent', 'auth inheritance'],
        bullets: [
          'Child requests can inherit auth from parent context',
          'Inherited auth fields still resolve environment variables and secrets',
          'Useful for collections that share a base token or API key'
        ]
      }
    ]
  },
  {
    id: 'templating',
    label: 'Templating',
    docs: [
      {
        title: 'Environments and Variables',
        summary: 'Switch between dev, staging, production, or any custom environment without changing requests.',
        tags: ['environment', 'variables', 'templating', 'global'],
        bullets: [
          'Global variables are available across collections and environments',
          'Environment variables are scoped to the selected environment',
          'Request variables can target all environments or a specific environment',
          'Variables are substituted into URLs, headers, body content, auth, scripts, and certificates'
        ]
      },
      {
        title: 'Pre-request Scripts',
        summary: 'Run JavaScript before a request to generate signatures, timestamps, tokens, headers, or dependent data.',
        tags: ['pre-request', 'script', 'javascript', 'automation'],
        bullets: [
          'Scripts can read and write variables for the current request',
          'Use scripts to compute HMAC signatures or dynamic headers',
          'Dependent requests can feed data into later requests'
        ]
      },
      {
        title: 'Test Scripts and Assertions',
        summary: 'Validate responses with JavaScript assertions after each request runs.',
        tags: ['tests', 'assertions', 'post-request', 'script'],
        bullets: [
          'Assert status codes, response times, headers, and JSON structures',
          'Run custom JavaScript against the response context',
          'Use tests for API contracts, regression checks, and CI-style validation'
        ]
      },
      {
        title: 'Request Chaining',
        summary: 'Connect requests together so one response can provide values for the next request.',
        tags: ['chaining', 'dependency', 'dependent request'],
        bullets: [
          'Requests can depend on another request',
          'Dependent execution carries generated values into the next request',
          'Useful for login flows, token exchange, and CRUD workflows'
        ]
      }
    ]
  },
  {
    id: 'secrets-privacy',
    label: 'Secrets and Privacy',
    docs: [
      {
        title: 'Secrets Encryption',
        summary: 'Store sensitive values with local encryption and reveal only secret names in the list view.',
        tags: ['secrets', 'encryption', 'privacy', 'security'],
        bullets: [
          'Secrets are encrypted before being stored locally',
          'Unlock with an encryption key to add, edit, import, or export secrets',
          'Secret detail shows the secret name, environment, and value',
          'The secrets list hides values by design'
        ]
      },
      {
        title: 'Local-first Storage',
        summary: 'Hailstorm keeps workspace data on your machine and avoids cloud sync requirements.',
        tags: ['local', 'privacy', 'storage', 'no account'],
        bullets: [
          'Collections, environments, secrets, history, and settings are stored locally',
          'No account is required to use the application',
          'Export load test data as JSON when you need a portable copy'
        ]
      }
    ]
  },
  {
    id: 'runner-load-testing',
    label: 'Runner and Load Testing',
    docs: [
      {
        title: 'Run Configurations',
        summary: 'Select requests from a collection and run them as sequential or repeated API workflows.',
        tags: ['runner', 'run config', 'collection runner', 'automation'],
        bullets: [
          'Create run configurations from the Runner sidebar',
          'Select a collection and the requests to include',
          'Configure run mode, delay, iterations, and repeated execution',
          'Runner details show selected requests and active environment context'
        ]
      },
      {
        title: 'Load Testing',
        summary: 'Scale selected requests into concurrent load tests with worker threads and live telemetry.',
        tags: ['load test', 'stress test', 'vu', 'rps', 'latency'],
        bullets: [
          'Configure virtual users, duration, ramp-up, and request rate',
          'Run selected requests in parallel or sequential mode',
          'Worker threads execute load test traffic and record timing data',
          'Live stats update total requests, successes, failures, average response time, and requests per second'
        ]
      },
      {
        title: 'Stats and Charts',
        summary: 'Review aggregated metrics, per-request breakdowns, and response-time percentiles after or during a run.',
        tags: ['stats', 'charts', 'percentile', 'response time'],
        bullets: [
          'Requests vs Time chart shows aggregated or per-request request counts',
          'Errors vs Time chart highlights 5xx failures',
          'Response Time chart supports mean, p50, p75, p90, p95, and p99 percentiles',
          'Completed runs can be selected, exported, or deleted from Stats'
        ]
      }
    ]
  },
  {
    id: 'history-console',
    label: 'History and Console',
    docs: [
      {
        title: 'History',
        summary: 'Review sent requests, reopen recent activity, and clear the history log when needed.',
        tags: ['history', 'recent', 'log'],
        bullets: [
          'Sent requests are captured with method, URL, headers, body, auth, scripts, and timestamp',
          'Recent request tabs appear at the bottom of Collections',
          'History can be cleared from the sidebar menu'
        ]
      },
      {
        title: 'Console',
        summary: 'Use the Console view for runtime messages and debugging output from the app workflow.',
        tags: ['console', 'debug', 'logs'],
        bullets: [
          'Console is available as a full-screen ribbon view',
          'Useful for observing app-level events while building requests',
          'Electron DevTools remain disabled by default for normal users'
        ]
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    docs: [
      {
        title: 'User Interface',
        summary: 'Customize theme, font sizes, sidebar visibility, compact mode, auto-save, and recent request count.',
        tags: ['settings', 'theme', 'font', 'layout', 'shortcuts'],
        bullets: [
          'Theme: light, dark, or system',
          'Font sizes for UI, code, and editor panes',
          'Show or hide the sidebar and reduce spacing with compact mode',
          'Keyboard shortcuts include Send Request, Save Request, Toggle Sidebar, and Search'
        ]
      },
      {
        title: 'Application',
        summary: 'Configure network behavior, certificates, proxy, and global variables.',
        tags: ['network', 'proxy', 'certificate', 'variables'],
        bullets: [
          'Request timeout and maximum response size',
          'Follow redirects and SSL certificate verification toggles',
          'Proxy URL, username, and password settings',
          'Global variables for workspace-wide substitution'
        ]
      },
      {
        title: 'Advanced',
        summary: 'Manage secrets, developer tools, shortcuts, and application information.',
        tags: ['advanced', 'developer tools', 'encryption'],
        bullets: [
          'Secrets encryption key setup and rotation',
          'Developer Tools toggle for renderer debugging',
          'Shortcut reference and application version'
        ]
      }
    ]
  }
];

const categoryById = computed(() => new Map(categories.map(category => [category.id, category])));

const activeCategory = computed(() => categoryById.value.get(selectedCategory.value) || categories[0]);

const flattenedDocs = computed(() => categories.flatMap(category => category.docs.map(doc => ({
  ...doc,
  categoryLabel: category.label,
  categoryId: category.id
}))));

const activeDocId = computed(() => visibleDocs.value[0]?.title || '');

const visibleDocs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const docs = query ? flattenedDocs.value.filter(doc => matchesSearch(doc, query)) : activeCategory.value.docs;

  if (!query) {
    return [docs.find(doc => doc.title === selectedDoc.value) || docs[0]];
  }

  return docs;
});

function matchesSearch(doc: DocsDoc, query: string): boolean {
  const haystack = [
    doc.title,
    doc.summary,
    doc.categoryLabel,
    ...doc.tags,
    ...doc.bullets,
    ...(doc.steps || [])
  ].join(' ').toLowerCase();

  return haystack.includes(query);
}

function selectCategory(categoryId: string) {
  selectedCategory.value = categoryId;
  selectedDoc.value = '';
}

function selectDoc(docTitle: string) {
  selectedDoc.value = docTitle;
}

function focusSearch() {
  const input = document.getElementById('docs-search') as HTMLInputElement | null;
  input?.focus();
}

function handleKeyboardShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    focusSearch();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcut);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyboardShortcut);
});
</script>

<style scoped>
.docs-layout {
  display: flex;
}

.docs-content article + article {
  margin-top: 1.5rem;
}

.docs-content ul {
  list-style-position: inside;
}
</style>
