<template>
  <div class="collections-panel">
  <div class="flex gap-2 mb-2" @click="showImportMenu = false">
    <div class="dropdown relative flex-1">
      <button class="btn btn-sm border border-zinc-500 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 w-full hover:bg-zinc-100 dark:hover:bg-zinc-800" @click.stop="showImportMenu = !showImportMenu">
        Import ▼
      </button>
      <div v-if="showImportMenu" class="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg z-10 min-w-full">
        <button class="block w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm" @click="handleImport('postman')">
          Import Postman Collection
        </button>
        <button class="block w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm" @click="handleImport('openapi')">
          Import OpenAPI Spec
        </button>
        <hr class="border-zinc-300 dark:border-zinc-600">
        <button class="block w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm text-blue-600" @click="handleImport('test')">
          Load Sample API
        </button>
      </div>
    </div>
    <button class="btn btn-sm bg-blue-500 text-white flex-1 hover:bg-blue-600" @click="collectionsStore.addCollection()">+ Collection</button>
  </div>
    <div v-if="collections.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-4">
      No collections yet
    </div>
    <div v-else>
      <div v-for="coll in collections" :key="coll.id" class="collection-item mb-2" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, coll.id, 'collection')">
        <div class="flex items-center p-2 rounded bg-zinc-200 dark:bg-zinc-800 cursor-pointer" @click="toggleCollection(coll.id)" @contextmenu.prevent="uiStore.showContextMenu($event, 'collection', coll.id)" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, coll.id, 'collection')">
          <span class="mr-2">{{ expandedCollections.includes(coll.id) ? '📂' : '📁' }}</span>
          <span class="flex-1 text-zinc-900 dark:text-white">{{ coll.name }}</span>
        </div>
        <div v-if="expandedCollections.includes(coll.id)" class="ml-3 mt-1" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, coll.id, 'collection')">
          <div v-if="coll.items.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-2 text-sm">
            Drop requests here
          </div>
          <template v-for="item in coll.items" :key="item.id">
            <div class="request-item p-1 rounded cursor-pointer mb-1 flex items-center" :class="item.id === requestsStore.selectedRequestId ? 'bg-blue-200 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'" :style="{ paddingLeft: '8px' }" @click="handleItemClick($event, item)" @contextmenu.prevent="uiStore.showContextMenu($event, getItemType(item), item.id)" role="button" tabindex="0" @keydown.enter="handleItemClick($event, item)" draggable="true" @dragstart="onDragStart($event, item, coll.id, 'collection')" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, hasItems(item) ? item.id : coll.id, hasItems(item) ? 'folder' : 'collection')">
              <span v-if="hasMethod(item) && (item as Request).flavors?.length" class="mr-1 cursor-pointer text-blue-400" @click.stop="toggleFlavors(item.id)">{{ (item as Request).flavors?.length ? (expandedFlavors.includes(item.id) ? '▼' : '▶') : '+' }}</span>
              <span v-if="hasMethod(item)" class="badge mr-1" :class="getMethodClass(item)">{{ getMethod(item) }}</span>
              <span v-if="hasItems(item)" class="mr-1">{{ expandedFolders.includes(item.id) ? '📂' : '📁' }}</span>
              <span v-if="hasItems(item)" class="text-zinc-900 dark:text-white">{{ item.name }}</span>
              <span v-else class="text-sm text-zinc-700 dark:text-zinc-300">{{ item.name }}</span>
            </div>
            <div v-if="hasItems(item)" class="ml-3" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, item.id, 'folder')">
              <div v-if="expandedFolders.includes(item.id)">
                <div v-if="(item as Folder).items.length === 0" class="text-center text-zinc-400 dark:text-zinc-500 py-1 text-sm">
                  Drop requests here
                </div>
                <div v-for="subItem in (item as Folder).items" :key="subItem.id" class="request-item p-1 rounded cursor-pointer mb-1 flex items-center" :class="subItem.id === requestsStore.selectedRequestId ? 'bg-blue-200 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'" :style="{ paddingLeft: '8px' }" @click="handleItemClick($event, subItem)" @contextmenu.prevent="uiStore.showContextMenu($event, getItemType(subItem), subItem.id)" role="button" tabindex="0" @keydown.enter="handleItemClick($event, subItem)" draggable="true" @dragstart="onDragStart($event, subItem, item.id, 'folder')" @dragover.prevent @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop($event, item.id, 'folder')">
                  <span v-if="hasMethod(subItem) && (subItem as Request).flavors?.length" class="mr-1 cursor-pointer text-blue-400" @click.stop="toggleFlavors(subItem.id)">{{ (subItem as Request).flavors?.length ? (expandedFlavors.includes(subItem.id) ? '▼' : '▶') : '+' }}</span>
                  <span v-if="hasMethod(subItem)" class="badge mr-1" :class="getMethodClass(subItem)">{{ getMethod(subItem) }}</span>
                  <span v-if="hasItems(subItem)" class="mr-1">{{ expandedFolders.includes(subItem.id) ? '📂' : '📁' }}</span>
                  <span v-if="hasItems(subItem)" class="text-zinc-900 dark:text-white">{{ subItem.name }}</span>
                  <span v-else class="text-sm text-zinc-700 dark:text-zinc-300">{{ subItem.name }}</span>
                </div>
              </div>
              <div v-else class="text-center text-zinc-400 dark:text-zinc-500 py-1 text-sm">
                Drop into {{ item.name }}
              </div>
            </div>
            <div v-if="hasMethod(item) && expandedFlavors.includes(item.id) && (item as Request).flavors?.length" class="ml-6">
              <div v-for="flavor in (item as Request).flavors" :key="flavor.id" class="request-item p-1 rounded cursor-pointer mb-1" :class="flavor.id === requestsStore.selectedRequestId ? 'bg-blue-200 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'" :style="{ paddingLeft: '8px' }" @click.stop="requestsStore.openRequest(flavor)" @contextmenu.prevent="uiStore.showContextMenu($event, 'flavor', flavor.id)">
                <span class="badge mr-1" :class="getMethodClass(flavor)">{{ flavor.method }}</span>
                <span class="text-sm text-blue-400">{{ flavor.name }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-item.drag-over {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 2px dashed #3b82f6 !important;
}

.collection-item.drag-over > div:first-child {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 2px dashed #3b82f6 !important;
}

.collection-item.drag-over {
  background-color: rgba(59, 130, 246, 0.05) !important;
  border-radius: 6px;
}

/* Import dropdown styling */
.dropdown {
  position: relative;
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCollectionsStore } from '../../stores/collections';
import { useRequestsStore } from '../../stores/requests';
import { useUIStore } from '../../stores/ui';
import type { Request, Folder } from '../../types';

console.log('[CollectionsPanel] Initializing stores...');
const collectionsStore = useCollectionsStore();
const requestsStore = useRequestsStore();
const uiStore = useUIStore();
console.log('[CollectionsPanel] Stores initialized:', { collectionsStore, requestsStore, uiStore });

const collections = computed(() => {
  const cols = collectionsStore.collections;
  console.log('[CollectionsPanel] collections computed:', cols, 'length:', cols?.length);
  return Array.isArray(cols) ? cols : [];
});

const expandedCollections = ref<string[]>([]);
const expandedFolders = ref<string[]>([]);
const expandedFlavors = ref<string[]>([]);
const showImportMenu = ref(false);

async function handleImport(importType: 'postman' | 'openapi' | 'test' = 'postman') {
  showImportMenu.value = false;

  // For testing - load a sample OpenAPI spec
  if (importType === 'test') {
    const sampleSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Sample Pet Store API',
        version: '1.0.0',
        description: 'A sample API for testing pet store operations'
      },
      servers: [
        {
          url: 'https://api.petstore.com/v1',
          description: 'Production server'
        }
      ],
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            operationId: 'listPets',
            tags: ['pets'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                description: 'How many items to return at one time',
                required: false,
                schema: {
                  type: 'integer',
                  format: 'int32'
                },
                example: 10
              }
            ],
            responses: {
              '200': {
                description: 'A paged array of pets',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Pet'
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create a pet',
            operationId: 'createPet',
            tags: ['pets'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Pet'
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created pet',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pet'
                    }
                  }
                }
              }
            }
          }
        },
        '/pets/{petId}': {
          get: {
            summary: 'Get a pet by ID',
            operationId: 'getPetById',
            tags: ['pets'],
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                description: 'The id of the pet to retrieve',
                schema: {
                  type: 'string'
                },
                example: '12345'
              }
            ],
            responses: {
              '200': {
                description: 'Expected response to a valid request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Pet'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Pet: {
            type: 'object',
            required: ['name'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
                example: 10
              },
              name: {
                type: 'string',
                example: 'Buddy'
              },
              category: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    format: 'int64',
                    example: 1
                  },
                  name: {
                    type: 'string',
                    example: 'Dogs'
                  }
                }
              },
              status: {
                type: 'string',
                description: 'pet status in the store',
                enum: ['available', 'pending', 'sold'],
                example: 'available'
              }
            }
          }
        }
      }
    };
    importOpenAPISpec(sampleSpec);
    return;
  }

  try {
    const acceptTypes = importType === 'openapi' ? '.json,.yaml,.yml' : '.json';

    if (!window.api) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptTypes;
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (importType === 'openapi') {
            importOpenAPISpec(data);
          } else {
            importData(data);
          }
        } catch (err) {
          console.error('Failed to import:', err);
        }
      };
      input.click();
      return;
    }

    const content = await window.api.importCollection();
    if (!content) {
      console.log('No content returned from file dialog');
      return;
    }
    const data = JSON.parse(content);
    if (importType === 'openapi') {
      importOpenAPISpec(data);
    } else {
      importData(data);
    }
  } catch (err) {
    console.error('Import error:', err);
  }
}

function convertPostmanHeaders(postmanHeaders: any): Variable[] {
  if (!Array.isArray(postmanHeaders)) {
    return [];
  }

  return postmanHeaders
    .filter((header: any) => header.key && header.value)
    .map((header: any) => ({
      key: header.key,
      value: header.value,
      enabled: !header.disabled && header.enabled !== false
    }));
}

function convertPostmanUrl(postmanUrl: any): string {
  if (typeof postmanUrl === 'string') {
    return postmanUrl;
  }

  if (typeof postmanUrl === 'object' && postmanUrl.raw) {
    return postmanUrl.raw;
  }

  if (Array.isArray(postmanUrl)) {
    // Handle URL as array of path components
    return postmanUrl.map((part: any) => {
      if (typeof part === 'string') return part;
      if (part.value) return part.value;
      return '';
    }).join('');
  }

  return '';
}

function convertPostmanBody(postmanBody: any): { type: string; content: string } {
  if (!postmanBody || !postmanBody.mode) {
    return { type: 'none', content: '' };
  }

  switch (postmanBody.mode) {
    case 'raw':
      return {
        type: 'raw',
        content: postmanBody.raw || ''
      };
    case 'urlencoded':
      if (postmanBody.urlencoded && Array.isArray(postmanBody.urlencoded)) {
        const params = postmanBody.urlencoded
          .filter((param: any) => param.key && param.value)
          .map((param: any) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
          .join('&');
        return {
          type: 'urlencoded',
          content: params
        };
      }
      return { type: 'none', content: '' };
    case 'formdata':
      if (postmanBody.formdata && Array.isArray(postmanBody.formdata)) {
        return {
          type: 'formdata',
          content: JSON.stringify(postmanBody.formdata)
        };
      }
      return { type: 'none', content: '' };
    case 'file':
      return {
        type: 'file',
        content: JSON.stringify(postmanBody.file || {})
      };
    case 'graphql':
      if (postmanBody.graphql) {
        return {
          type: 'graphql',
          content: JSON.stringify(postmanBody.graphql)
        };
      }
      return { type: 'none', content: '' };
    default:
      return { type: 'none', content: '' };
  }
}

function importData(data: any) {
  if (!data) {
    console.log('[IMPORT] importData called with null/undefined data');
    return;
  }

  console.log('[IMPORT] Starting import, data keys:', Object.keys(data));
  if (data.info) {
    console.log('[IMPORT] Postman collection:', data.info.name, 'with', data.item?.length || 0, 'items');
  }

  const processItems = (items: any[]): any[] => {
    return items.map((item: any) => {
      const newItem = { ...item };

      // Handle Postman format where request data is nested under 'request' property
      if (newItem.request && typeof newItem.request === 'object') {
        const requestData = newItem.request;
        newItem.method = requestData.method || 'GET';
        newItem.url = convertPostmanUrl(requestData.url) || '';
        newItem.headers = convertPostmanHeaders(requestData.header) || [];
        newItem.body = convertPostmanBody(requestData.body);
        newItem.auth = requestData.auth;
        newItem.preRequestScript = requestData.preRequestScript;
        newItem.testScript = requestData.testScript;
        newItem.variables = requestData.variables;
        newItem.flavors = requestData.flavors;
        delete newItem.request;
      }

      if (!newItem.id) {
        newItem.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      if (newItem.item && Array.isArray(newItem.item)) {
        newItem.items = processItems(newItem.item);
        delete newItem.item;
      }

      return newItem;
    });
  };
  const processCollection = (c: any) => ({
    ...c,
    items: processItems(c.items || [])
  });

  if (data.collection) {
    collectionsStore.collections.push(processCollection(data.collection));
    collectionsStore.saveCollections();
  } else if (data.collections) {
    collectionsStore.collections.push(...data.collections.map(processCollection));
    collectionsStore.saveCollections();
  } else if (Array.isArray(data)) {
    collectionsStore.collections.push(...data.map(processCollection));
    collectionsStore.saveCollections();
  } else if (data.info && data.item) {
    const processedItems = processItems(data.item);
    collectionsStore.collections.push({
      id: `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.info.name || 'Imported Collection',
      items: processedItems,
      variables: []
    });
    console.log(`[IMPORT] Successfully imported Postman collection "${data.info.name}" with ${processedItems.length} requests`);
    collectionsStore.saveCollections();
  } else {
    console.log('[IMPORT] Unknown collection format:', Object.keys(data));
  }
}

function importOpenAPISpec(spec: any) {
  console.log('[OPENAPI] Starting OpenAPI import:', spec.info?.title);

  if (!spec || !spec.info) {
    console.error('[OPENAPI] Invalid OpenAPI spec - missing info');
    return;
  }

  // Extract base server URL
  const baseUrl = getBaseServerUrl(spec);

  // Group paths by tags for folder organization
  const tagGroups: Record<string, any[]> = {};
  const untaggedRequests: any[] = [];

  // Process each path
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      if (method === 'parameters') continue; // Skip path-level parameters

      const request = createRequestFromOperation(path, method.toUpperCase(), operation as any, spec, baseUrl);

      // Group by tags
      const tags = (operation as any).tags || [];
      if (tags.length > 0) {
        const tag = tags[0]; // Use first tag
        if (!tagGroups[tag]) {
          tagGroups[tag] = [];
        }
        tagGroups[tag].push(request);
      } else {
        untaggedRequests.push(request);
      }
    }
  }

  // Create collection with folders
  const collection: any = {
    id: `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: spec.info.title || 'OpenAPI Import',
    description: spec.info.description,
    items: [],
    variables: []
  };

  // Add tagged folders
  for (const [tag, requests] of Object.entries(tagGroups)) {
    const folder: any = {
      id: `fol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: tag,
      items: requests
    };
    collection.items.push(folder);
  }

  // Add untagged requests
  collection.items.push(...untaggedRequests);

  collectionsStore.collections.push(collection);
  collectionsStore.saveCollections();

  console.log(`[OPENAPI] Successfully imported "${spec.info.title}" with ${Object.keys(tagGroups).length} folders and ${untaggedRequests.length} untagged requests`);
}

function getBaseServerUrl(spec: any): string {
  if (!spec.servers || spec.servers.length === 0) {
    return '';
  }

  const server = spec.servers[0];
  let url = server.url;

  // Replace variables with example values
  if (server.variables) {
    for (const [key, variable] of Object.entries(server.variables as any)) {
      const defaultValue = (variable as any).default || (variable as any).example || `{${key}}`;
      url = url.replace(`{${key}}`, defaultValue);
    }
  }

  return url;
}

function createRequestFromOperation(path: string, method: string, operation: any, spec: any, baseUrl: string): any {
  // Build full URL
  const fullUrl = baseUrl ? `${baseUrl}${path}` : path;

  // Extract path parameters and replace with example values
  let processedUrl = fullUrl;
  const pathParams = operation.parameters?.filter((p: any) => p.in === 'path') || [];

  for (const param of pathParams) {
    const example = param.example || param.schema?.example || `{${param.name}}`;
    processedUrl = processedUrl.replace(`{${param.name}}`, example);
  }

  // Create request object
  const request: any = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: operation.summary || `${method} ${path}`,
    method,
    url: processedUrl,
    headers: [],
    body: { type: 'none', content: '' },
    variables: []
  };

  // Add query parameters
  const queryParams = operation.parameters?.filter((p: any) => p.in === 'query') || [];
  if (queryParams.length > 0) {
    const queryString = queryParams
      .map((param: any) => {
        const example = param.example || param.schema?.example || '';
        return `${param.name}=${encodeURIComponent(example)}`;
      })
      .join('&');

    if (queryString) {
      request.url += (request.url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Add header parameters
  const headerParams = operation.parameters?.filter((p: any) => p.in === 'header') || [];
  for (const param of headerParams) {
    const example = param.example || param.schema?.example || '';
    request.headers.push({
      key: param.name,
      value: example.toString(),
      enabled: true
    });
  }

  // Handle request body
  if (operation.requestBody) {
    const content = operation.requestBody.content || {};
    const contentType = Object.keys(content)[0];

    if (contentType) {
      request.headers.push({
        key: 'Content-Type',
        value: contentType,
        enabled: true
      });

      if (contentType === 'application/json') {
        const schema = content[contentType].schema;
        const example = generateJsonExample(schema, spec);
        request.body = {
          type: 'raw',
          content: JSON.stringify(example, null, 2)
        };
      } else if (contentType === 'application/x-www-form-urlencoded') {
        const schema = content[contentType].schema;
        const example = generateFormExample(schema, spec);
        request.body = {
          type: 'urlencoded',
          content: example
        };
      } else if (contentType === 'multipart/form-data') {
        const schema = content[contentType].schema;
        const example = generateFormDataExample(schema, spec);
        request.body = {
          type: 'formdata',
          content: JSON.stringify(example)
        };
      }
    }
  }

  return request;
}

function generateJsonExample(schema: any, spec: any, visitedRefs = new Set()): any {
  if (!schema) return {};

  // Handle $ref
  if (schema.$ref) {
    if (visitedRefs.has(schema.$ref)) {
      return {}; // Avoid circular references
    }
    visitedRefs.add(schema.$ref);

    const refPath = schema.$ref.replace('#/', '').split('/');
    let refObj = spec;
    for (const part of refPath) {
      refObj = refObj[part];
    }

    return generateJsonExample(refObj, spec, visitedRefs);
  }

  // Handle different schema types
  switch (schema.type) {
    case 'object':
      const obj: any = {};
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties as any)) {
          obj[key] = generateJsonExample(propSchema, spec, visitedRefs);
        }
      }
      return obj;

    case 'array':
      return [generateJsonExample(schema.items, spec, visitedRefs)];

    case 'string':
      return schema.example || schema.default || 'string';

    case 'number':
    case 'integer':
      return schema.example || schema.default || 0;

    case 'boolean':
      return schema.example || schema.default || false;

    default:
      return schema.example || schema.default || null;
  }
}

function generateFormExample(schema: any, spec: any): string {
  if (!schema || !schema.properties) return '';

  const params = [];
  for (const [key, propSchema] of Object.entries(schema.properties as any)) {
    const example = generateJsonExample(propSchema, spec);
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(example)}`);
  }

  return params.join('&');
}

function generateFormDataExample(schema: any, spec: any): any[] {
  if (!schema || !schema.properties) return [];

  const formData = [];
  for (const [key, propSchema] of Object.entries(schema.properties as any)) {
    const example = generateJsonExample(propSchema, spec);
    formData.push({
      key,
      value: example.toString(),
      type: 'text'
    });
  }

  return formData;
}

function toggleCollection(id: string) {
  const index = expandedCollections.value.indexOf(id);
  if (index > -1) {
    expandedCollections.value.splice(index, 1);
  } else {
    expandedCollections.value.push(id);
  }
  // Also select the collection to show details
  collectionsStore.selectCollection(id);
}

function handleItemClick(event: MouseEvent, item: any) {
  event.preventDefault();
  event.stopPropagation();
  console.log('handleItemClick item:', item, 'keys:', Object.keys(item));
  if (hasItems(item)) {
    toggleFolder(item.id);
  } else {
    requestsStore.selectRequest(item.id);
  }
}

function toggleFolder(id: string) {
  const index = expandedFolders.value.indexOf(id);
  if (index > -1) {
    expandedFolders.value.splice(index, 1);
  } else {
    expandedFolders.value.push(id);
  }
}

function toggleFlavors(id: string) {
  const index = expandedFlavors.value.indexOf(id);
  if (index > -1) {
    expandedFlavors.value.splice(index, 1);
  } else {
    expandedFlavors.value.push(id);
  }
}

function hasMethod(item: any): boolean {
  if ('request' in item) {
    return 'method' in item.request;
  }
  return 'method' in item;
}

function hasItems(item: any): boolean {
  return 'items' in item;
}

function getMethod(item: any): string {
  if ('request' in item) {
    return item.request.method;
  }
  return item.method;
}

function getItemType(item: any): string {
  if ('request' in item) {
    return 'request';
  }
  return 'method' in item ? 'request' : 'folder';
}

function getMethodClass(item: any): string {
  const method = (('request' in item) ? item.request.method : item.method)?.toLowerCase() || 'get';
  return method === 'get' ? 'text-green-800 dark:text-green-200 font-dancing font-bold text-xs' : method === 'post' ? 'text-blue-800 dark:text-blue-200 font-dancing font-bold text-xs' : method === 'put' ? 'text-amber-800 dark:text-amber-200 font-dancing font-bold text-xs' : method === 'delete' ? 'text-red-800 dark:text-red-200 font-dancing font-bold text-xs' : 'text-cyan-800 dark:text-cyan-200 font-dancing font-bold text-xs';
}

function onDragStart(event: DragEvent, item: any, containerId: string, containerType: 'collection' | 'folder') {
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('text/plain', JSON.stringify({
    itemId: item.id,
    containerId,
    containerType
  }));
  console.log('🔄 DRAG START:', item.name, 'from', containerType, containerId);
}

function onDragEnter(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation(); // Prevent event bubbling

  const target = event.target as HTMLElement;

  console.log('📍 DRAG ENTER on:', target.tagName, target.className, 'closest .request-item:', !!target.closest('.request-item'), 'closest .collection-item:', !!target.closest('.collection-item'));

  // Find the actual drop target element
  const requestItem = target.closest('.request-item');
  const collectionItem = target.closest('.collection-item');

  if (requestItem) {
    console.log('✅ Adding drag-over to request item');
    requestItem.classList.add('drag-over');
  } else if (collectionItem) {
    console.log('✅ Adding drag-over to collection item');
    collectionItem.classList.add('drag-over');
  } else {
    console.log('❌ No valid drop target found');
  }
}

function onDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation(); // Prevent event bubbling

  const target = event.target as HTMLElement;

  console.log('📍 DRAG LEAVE from:', target.tagName, target.className);

  // Find the actual drop target element
  const requestItem = target.closest('.request-item');
  const collectionItem = target.closest('.collection-item');

  if (requestItem) {
    console.log('✅ Removing drag-over from request item');
    requestItem.classList.remove('drag-over');
  } else if (collectionItem) {
    console.log('✅ Removing drag-over from collection item');
    collectionItem.classList.remove('drag-over');
  }
}

function onDrop(event: DragEvent, targetContainerId: string, targetContainerType: 'collection' | 'folder') {
  event.preventDefault();
  event.stopPropagation(); // Prevent event bubbling to parent drop zones

  const target = event.target as HTMLElement;
  target.classList.remove('drag-over');

  console.log('🎯 DROP EVENT on target:', target.tagName, target.className, 'targetContainerId:', targetContainerId, 'targetContainerType:', targetContainerType);

  try {
    const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
    const { itemId, containerId, containerType } = data;

    console.log('📦 Drop data:', { itemId, containerId, containerType, targetContainerId, targetContainerType });

    // Prevent dropping on itself
    if (itemId === targetContainerId) {
      console.log('❌ Prevented drop on itself');
      return;
    }

    // Prevent dropping a folder into itself or its subfolders
    if (containerType === 'folder' && targetContainerType === 'folder' && isDescendant(itemId, targetContainerId)) {
      console.log('❌ Prevented dropping folder into itself or descendant');
      return;
    }

    console.log('✅ Executing drop:', itemId, 'from', containerType, containerId, 'to', targetContainerType, targetContainerId);

    const result = collectionsStore.moveItem(itemId, targetContainerId, targetContainerType);
    console.log('📋 Move result:', result);

  } catch (error) {
    console.error('❌ Error handling drop:', error);
  }
}

function isDescendant(itemId: string, potentialParentId: string): boolean {
  // Find the potential parent and check if itemId exists in its subtree
  const findItemInParentSubtree = (items: any[]): boolean => {
    for (const item of items) {
      if (item.id === potentialParentId && 'items' in item) {
        // Found the parent, now check if itemId is in its subtree
        const hasItemInSubtree = (subItems: any[]): boolean => {
          for (const subItem of subItems) {
            if (subItem.id === itemId) return true;
            if ('items' in subItem && subItem.items) {
              if (hasItemInSubtree(subItem.items)) return true;
            }
          }
          return false;
        };
        return hasItemInSubtree(item.items);
      }
      if ('items' in item && item.items) {
        if (findItemInParentSubtree(item.items)) return true;
      }
    }
    return false;
  };

  for (const collection of collectionsStore.collections) {
    if (findItemInParentSubtree(collection.items)) return true;
  }
  return false;
}
</script>