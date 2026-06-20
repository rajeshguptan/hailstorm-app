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
      <RequestTree 
        :collections="collections" 
        v-model:expanded-collections="expandedCollections"
        v-model:expanded-folders="expandedFolders"
        v-model:selected-request-id="requestsStore.selectedRequestId"
      />
    </div>
  </div>
</template>

<style scoped>
/* Import dropdown styling */
.dropdown {
  position: relative;
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCollectionsStore } from '../../stores/collections';
import { useRequestsStore } from '../../stores/requests';
import { useUIStore } from '../../stores/ui';
import RequestTree from '../RequestTree.vue';
import type { Request, Folder } from '../../types';
import { logger } from '../../utils/logger';

logger.debug('[CollectionsPanel] Initializing stores...');
const collectionsStore = useCollectionsStore();
const requestsStore = useRequestsStore();
const uiStore = useUIStore();
logger.debug('[CollectionsPanel] Stores initialized');

const collections = computed(() => {
  const cols = collectionsStore.collections;
  logger.debug('[CollectionsPanel] collections computed, length:', cols?.length);
  return Array.isArray(cols) ? cols : [];
});

const expandedCollections = ref<string[]>([]);
const expandedFolders = ref<string[]>([]);
const showImportMenu = ref(false);

// Watch for v-model changes to selectedRequestId and load request details
// This is needed because v-model only sets the ID, but we need to load the full request
watch(() => requestsStore.selectedRequestId, (newId) => {
  logger.debug('[CollectionsPanel] selectedRequestId watcher triggered:', newId);
  // Only load if the request isn't already the one we want
  if (newId && requestsStore.currentRequest.id !== newId) {
    requestsStore.selectRequest(newId);
  }
});

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

function normalizeCollectionVariables(variables: any[] = []): any[] {
  return variables.map((variable: any) => ({
    key: variable.key || '',
    value: variable.value ?? variable.default ?? '',
    enabled: variable.enabled !== false,
    env: ''
  }));
}

function importData(data: any) {
  if (!data) {
    logger.debug('[IMPORT] importData called with null/undefined data');
    return;
  }

  logger.debug('[IMPORT] Starting import, data keys:', Object.keys(data));
  if (data.info) {
    logger.debug('[IMPORT] Postman collection:', data.info.name, 'with', data.item?.length || 0, 'items');
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
    items: processItems(c.items || []),
    variables: normalizeCollectionVariables(c.variables || c.variable || [])
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
      variables: normalizeCollectionVariables(data.variable || [])
    });
    logger.debug(`[IMPORT] Successfully imported Postman collection "${data.info.name}" with ${processedItems.length} requests`);
    collectionsStore.saveCollections();
  }
}

function importOpenAPISpec(spec: any) {
  logger.debug('[OPENAPI] Starting OpenAPI import:', spec.info?.title);

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
</script>