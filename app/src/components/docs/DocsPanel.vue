<template>
  <div class="docs-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200" data-testid="docs-panel">
    <div class="docs-layout min-h-0 flex-1 overflow-hidden">
      <aside class="docs-sidebar w-72 flex-shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/30">
        <div class="p-4">
          <div class="relative mb-4">
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
          <nav class="space-y-6" aria-label="Documentation sections">
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
        </div>
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

          <div v-if="doc.examples?.length" class="mb-6">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Examples</h3>
            <div v-for="(example, idx) in doc.examples" :key="idx" class="mb-4 last:mb-0">
              <p v-if="example.description" class="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{{ example.description }}</p>
              <pre class="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-xs"><code>{{ example.code }}</code></pre>
            </div>
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
  examples?: { description?: string; code: string }[];
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
          'Open Collections from the left ribbon and click "New Collection" or "Load Sample API".',
          'Select the collection, then click "+" or right-click to add a new request.',
          'Enter the method (GET, POST, etc.) and URL. Add optional headers, query params, or body.',
          'Choose an environment from the dropdown if using environment variables, then click Send.',
          'Review the response in the right panel: body, headers, timing, and test results.'
        ],
        bullets: [
          'Requests auto-save when layout auto-save is enabled (default)',
          'Recent requests appear as tabs at the bottom of the Collections view',
          'History stores all sent requests for later review and re-play'
        ]
      },
      {
        title: 'Workspace Layout',
        summary: 'Hailstorm uses a left ribbon, optional sidebar, request editor, response panel, and full-screen utility views.',
        tags: ['layout', 'ribbon', 'sidebar', 'navigation'],
        bullets: [
          'Ribbon navigation: Collections, History, Secrets, Stats, Runner, Console, Docs, Settings, Feedback',
          'Collections, History, Secrets, and Runner use a resizable sidebar (200-600px)',
          'Stats, Console, Settings, and Docs use the full main content area',
          'Response panel height is resizable and persists locally',
          'Right-click items for context menus (add, duplicate, rename, delete)'
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
          'Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, or custom (e.g., PROPFIND)',
          'Body types: JSON, form data, URL encoded, raw text, binary, GraphQL, or none',
          'Headers and query parameters support variable substitution via {{variableName}}',
          'Redirect following, timeout (ms), SSL verification, and response size limits configurable in Settings'
        ],
        examples: [
          {
            description: 'GET request with query parameters:',
            code: 'GET https://api.example.com/users?id=123&limit=10\nHeaders: Authorization: Bearer {{token}}'
          },
          {
            description: 'POST request with JSON body:',
            code: 'POST https://api.example.com/users\nContent-Type: application/json\n\n{\n  "name": "{{userName}}",\n  "email": "{{userEmail}}"\n}'
          }
        ]
      },
      {
        title: 'GraphQL Requests',
        summary: 'Create GraphQL POST requests with operation name, variables, and a dedicated query editor.',
        tags: ['graphql', 'query', 'variables', 'operation'],
        bullets: [
          'Select "GraphQL" body type to switch to query, variables, and operation name fields',
          'Variables are typed as JSON and support {{variable}} substitution',
          'Headers, auth, and scripts behave like other request types'
        ],
        examples: [
          {
            description: 'GraphQL query with variables:',
            code: 'query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n    email\n  }\n}\n\n{\n  "id": "{{userId}}"\n}'
          }
        ]
      },
      {
        title: 'JSON-RPC Requests',
        summary: 'Send JSON-RPC requests as JSON bodies with a clear RPC badge in the collection tree.',
        tags: ['json-rpc', 'rpc', 'json', 'batch'],
        bullets: [
          'JSON-RPC requests are stored as POST requests with JSON body content',
          'Set isJsonRpc: true on the request to show an RPC badge in the collection tree',
          'Use variables and scripts to generate jsonrpc version, method, params, and id values'
        ],
        examples: [
          {
            description: 'JSON-RPC 2.0 request:',
            code: '{\n  "jsonrpc": "2.0",\n  "method": "getUser",\n  "params": {\n    "id": {{userId}},\n    "includeProfile": true\n  },\n  "id": 1\n}'
          }
        ]
      },
      {
        title: 'WebSocket Connections',
        summary: 'Connect to WebSocket endpoints, send JSON, XML, or text messages, and inspect live frames.',
        tags: ['websocket', 'ws', 'socket', 'streaming'],
        bullets: [
          'Set request method to WebSocket or enable isWebSocket flag',
          'Message body types: JSON, XML, or plain text',
          'Live frames appear in the response panel and Console view'
        ],
        examples: [
          {
            description: 'WebSocket connection URL:',
            code: 'ws://localhost:4000/ws\nwss://api.example.com/socket'
          },
          {
            description: 'JSON message to send after connection:',
            code: '{"type": "subscribe", "channel": "updates"}'
          }
        ]
      },
      {
        title: 'Shell Commands',
        summary: 'Run local shell commands from the request editor when a request method is set to SHELL.',
        tags: ['shell', 'command', 'terminal', 'local'],
        bullets: [
          'Set method to SHELL and enter the command in the URL field',
          'The editor switches to a shell script detail view',
          'Output appears in the response panel (stdout/stderr)',
          'Useful for testing webhooks, scripts, or local tooling'
        ],
        examples: [
          {
            description: 'Shell commands:',
            code: 'curl -X POST http://localhost:3000/webhook\ncurl -X POST {{webhookUrl}} -d \'{"event": "test"}\'\nnode -e "console.log(process.env)"\ndate +%s'
          }
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
          'Right-click in the sidebar to add HTTP, GraphQL, JSON-RPC, WebSocket, or shell requests',
          'Add folders to group related requests together',
          'Duplicate, rename, copy, paste, and delete via context menu or keyboard shortcuts',
          'JSON-RPC requests show an RPC badge in the tree for easy identification'
        ]
      },
      {
        title: 'Import and Export',
        summary: 'Bring existing API definitions into Hailstorm or export completed load test runs as JSON.',
        tags: ['import', 'export', 'postman', 'openapi'],
        bullets: [
          'Import Postman collections from JSON files via Collections sidebar menu',
          'Import OpenAPI/Swagger specs to auto-generate requests grouped by API tags',
          'Export load test run data from the Stats panel as JSON',
          'Collections are stored locally in a JSON-friendly format for version control'
        ]
      },
      {
        title: 'Request Editor',
        summary: 'Configure every part of a request from one editor with tabs for parameters, auth, headers, body, variables, scripts, and description.',
        tags: ['editor', 'parameters', 'scripts', 'description'],
        bullets: [
          'Parameters tab: edit query string keys and values',
          'Variables tab: define request-scoped variables with optional environment targeting',
          'Description tab: write Markdown notes for the request',
          'Dependencies tab: select a request whose response provides data for this request',
          'Pre-request Script: JavaScript that runs before sending (e.g., generate auth headers)',
          'Test Script: JavaScript assertions against the response'
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
          'Bearer Token: sends Authorization: Bearer &lt;token&gt; header',
          'Basic Auth: encodes username:password for Authorization header',
          'API Key: send as header or query parameter (configurable)',
          'NTLM: Windows integrated authentication',
          'Client Certificate: PKCS#12 (.pfx/.p12) or PEM certificate/key pair',
          'Inherit Auth: child requests use parent collection/folder auth',
          'All auth fields support variable substitution'
        ]
      },
      {
        title: 'OAuth 2.0',
        summary: 'Configure OAuth 2.0 authorization code flow with PKCE and token storage for authenticated requests.',
        tags: ['oauth2', 'oauth', 'pkce', 'token'],
        bullets: [
          'Authorization URL: endpoint for user login (opens system browser)',
          'Token URL: exchanges authorization code for tokens',
          'Client ID/Secret: application credentials from your OAuth provider',
          'Scope: space-separated permissions (e.g., "read write")',
          'Redirect URI: callback URL (auto-handled via hailstorm:// protocol)',
          'PKCE: generates code_verifier for enhanced security'
        ],
        examples: [
          {
            description: 'OAuth configuration example:',
            code: 'Authorization URL: https://auth.example.com/authorize\nToken URL: https://auth.example.com/token\nClient ID: your-client-id\nScope: openid profile email'
          }
        ]
      },
      {
        title: 'Request Inheritance',
        summary: 'Reuse authentication from a parent collection or folder request to avoid duplicating credentials.',
        tags: ['inherit', 'parent', 'auth inheritance'],
        bullets: [
          'Set auth type to "Inherit" to use parent auth context',
          'Inherited auth resolves environment variables and secrets at runtime',
          'Ideal for APIs where all endpoints share the same base token'
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
          'Global variables: accessible across all collections and environments',
          'Environment variables: scoped to a specific environment',
          'Request variables: defined on a request with optional env targeting',
          'Syntax: {{variableName}} or {{variableName:default}} for fallbacks',
          'Variables substitute into URLs, headers, body, auth, scripts, and certificates'
        ],
        examples: [
          {
            description: 'Variable substitution examples:',
            code: 'URL: {{baseUrl}}/api/users\nHeader: Authorization: Bearer {{apiToken}}\nBody: {"url": "https://{{env}}.api.example.com"}'
          }
        ]
      },
      {
        title: 'Pre-request Scripts',
        summary: 'Run JavaScript before a request to generate signatures, timestamps, tokens, headers, or dependent data.',
        tags: ['pre-request', 'script', 'javascript', 'automation'],
        bullets: [
          'Access pm.environment.get/set for environment variables',
          'Use pm.variables to read/write request variables',
          'Common use cases: HMAC auth, timestamp injection, token refresh'
        ],
        examples: [
          {
            description: 'Generate HMAC signature:',
            code: 'const crypto = require("crypto");\nconst timestamp = Date.now();\nconst signature = crypto.createHmac("sha256", pm.environment.get("secret")).update(timestamp.toString()).digest("hex");\n\npm.variables.set("timestamp", timestamp);\npm.variables.set("signature", signature);'
          },
          {
            description: 'Dynamic auth header:',
            code: 'const token = pm.environment.get("authToken");\npm.variables.set("authHeader", `Bearer ${token}`);'
          }
        ]
      },
      {
        title: 'Test Scripts and Assertions',
        summary: 'Validate responses with JavaScript assertions after each request runs.',
        tags: ['tests', 'assertions', 'post-request', 'script'],
        bullets: [
          'Access response via pm.response.json() or pm.response.text()',
          'Use pm.test() to define named assertions',
          'Assert status codes, response times, headers, and JSON structures',
          'Tests run in a sandboxed Node.js environment'
        ],
        examples: [
          {
            description: 'Test assertions:',
            code: 'pm.test("Status is 200", () => pm.response.to.have.status(200));\npm.test("Response time < 200ms", () => pm.expect(pm.response.responseTime).to.be.below(200));\npm.test("Has user ID", () => pm.expect(pm.response.json().id).to.exist);'
          }
        ]
      },
      {
        title: 'Request Chaining',
        summary: 'Connect requests together so one response can provide values for the next request.',
        tags: ['chaining', 'dependency', 'dependent request'],
        bullets: [
          'In request editor, select a dependency to receive its response',
          'Access dependency data via {{dependency.response.body}}',
          'Common patterns: login -> use token, create -> get ID for update/delete'
        ],
        examples: [
          {
            description: 'Chain login to protected request:',
            code: 'Request A: POST /login {\"user\": \"admin\"}\nResponse: {"token": "abc123"}\n\nRequest B: GET /profile\nHeader: Authorization: Bearer {{login_response.token}}'
          }
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
          'All secrets are encrypted before being stored in local storage',
          'Set an encryption key on first use; it unlocks secrets for the session',
          'Secret names are visible in the list, but values are masked',
          'Export secrets to JSON for backup (values are unencrypted in the export)',
          'Change the encryption key from Settings > Secrets'
        ]
      },
      {
        title: 'Local-first Storage',
        summary: 'Hailstorm keeps workspace data on your machine and avoids cloud sync requirements.',
        tags: ['local', 'privacy', 'storage', 'no account'],
        bullets: [
          'All data stored in localStorage: collections, environments, secrets, history, settings',
          'No internet connection required for core functionality',
          'Export collections and load test data for version control or backup',
          'Delete localStorage to reset all application data'
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
          'Create a run configuration from the Runner sidebar (plus button)',
          'Select a collection and configure which requests to include',
          'Choose run mode: parallel (all at once) or sequential (one after another)',
          'Set delay between requests and number of iterations',
          'Per-request RPS controls concurrent requests per endpoint'
        ]
      },
      {
        title: 'Load Testing',
        summary: 'Scale selected requests into concurrent load tests with worker threads and live telemetry.',
        tags: ['load test', 'stress test', 'vu', 'rps', 'latency'],
        bullets: [
          'Virtual Users: number of worker threads generating traffic',
          'Duration: total run time in seconds (0 = unlimited)',
          'Ramp-up: time in seconds to reach full VU count',
          'Per-request RPS: requests per second per endpoint',
          'Live stats update: total requests, success rate, failures, avg response time'
        ],
        examples: [
          {
            description: 'Load test configuration:',
            code: 'Virtual Users: 10\nDuration: 60 seconds\nRamp-up: 10 seconds\nPer-request RPS: 5'
          }
        ]
      },
      {
        title: 'Stats and Charts',
        summary: 'Review aggregated metrics, per-request breakdowns, and response-time percentiles after or during a run.',
        tags: ['stats', 'charts', 'percentile', 'response time'],
        bullets: [
          'Requests vs Time: aggregated or per-request request counts over time',
          'Errors vs Time: tracks 5xx failures on a timeline',
          'Response Time: mean, p50, p75, p90, p95, p99 percentiles',
          'Export completed run data as JSON from Stats panel',
          'Delete runs to free up storage space'
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
          'Every sent request is saved with full configuration and timestamp',
          'Click any history item to reload it into the request editor',
          'Recent request tabs appear at the bottom of the Collections view (most recent = leftmost)',
          'Modified requests show orange tint; successful = green'
        ]
      },
      {
        title: 'Console',
        summary: 'Use the Console view for runtime messages and debugging output from the app workflow.',
        tags: ['console', 'debug', 'logs'],
        bullets: [
          'View app-level events, load test progress, and runtime messages',
          'Accessible via Console icon in ribbon',
          'Shows timestamps and categorized messages during operations'
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
          'Theme: Light (always light), Dark (always dark), System (follow OS preference)',
          'Font sizes: adjust UI, code editor, and monospace font sizes independently',
          'Compact mode: reduces spacing for more content on screen',
          'Show Sidebar: toggle sidebar visibility in Collections/History views',
          'Auto-save requests: automatically save changes without pressing Ctrl+S'
        ]
      },
      {
        title: 'Application',
        summary: 'Configure network behavior, certificates, proxy, and global variables.',
        tags: ['network', 'proxy', 'certificate', 'variables'],
        bullets: [
          'Request timeout: maximum time to wait for response (milliseconds)',
          'Maximum response size: truncate large responses to prevent memory issues',
          'Follow redirects: automatically follow 3xx responses',
          'Verify SSL certificates: disable for self-signed certs (not recommended)',
          'Proxy URL: HTTP proxy including http:// or https:// prefix',
          'Global variables: key-value pairs for workspace-wide substitution'
        ]
      },
      {
        title: 'Advanced',
        summary: 'Manage secrets, developer tools, shortcuts, and application information.',
        tags: ['advanced', 'developer tools', 'encryption'],
        bullets: [
          'Set or change the encryption key for secrets storage',
          'Enable Developer Tools to open Chrome DevTools in the renderer',
          'View keyboard shortcuts reference',
          'Application version and build information'
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
    ...(doc.steps || []),
    ...(doc.examples?.flatMap(e => [e.description, e.code]) || [])
  ].join(' ').toLowerCase();

  return haystack.includes(query);
}

function selectCategory(categoryId: string) {
  selectedCategory.value = categoryId;
  selectedDoc.value = '';
}

function selectDoc(docTitle: string) {
  const doc = flattenedDocs.value.find(d => d.title === docTitle);
  if (doc) {
    selectedCategory.value = doc.categoryId;
    selectedDoc.value = docTitle;
  }
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

pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>