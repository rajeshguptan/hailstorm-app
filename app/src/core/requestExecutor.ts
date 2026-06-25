import type { SendRequestContext, SendRequestResult, Auth } from '../types';
import { substituteAll } from './authHandler';
import { makeHttpRequest } from './httpClient';
import { flatRequests } from './httpExecutor';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VariableData {
  key: string;
  value: string;
  enabled: boolean;
  env?: string;
}

interface ExecutedRequest {
  id: string;
  name: string;
  status: number;
  statusText: string;
  time: number;
  error?: string;
}

interface RequestSnapshot {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: { type: string; content: string };
  auth?: Auth;
  preRequestScript?: string;
  postRequestScript?: string;
  testScript?: string;
  variables?: VariableData[];
  dependsOn?: string;
  isJsonRpc?: boolean;
}

interface RequestsStoreData {
  currentRequest: RequestSnapshot;
  requestHeaders: { key: string; value: string; enabled: boolean }[];
}

interface EnvironmentsStoreData {
  environments: { id: string; name: string; variables: VariableData[]; active: boolean }[];
  activeEnvironmentId: string | null;
}

interface CollectionsStoreData {
  collections: { id: string; name: string; items: any[]; variables: VariableData[] }[];
  selectedCollectionId: string | null;
}

interface AppStoreData {
  secrets: { id: string; name: string; env: string; value: string }[];
  selectedSecretId: string | null;
}

interface SecretsStoreData {
  isUnlocked: boolean;
}

async function executeDepRequest(
   request: any,
   seVars: VariableData[],
   reqVars: VariableData[],
   secrets: { name: string; value: string }[] | undefined,
   collectionVars: VariableData[],
   parentAuth?: Auth | undefined,
): Promise<ExecutedRequest> {
   let url = substituteAll(request.url, seVars, reqVars, secrets, collectionVars);
   let body = request.body && request.body.type !== 'none' && request.body.content
     ? substituteAll(request.body.content, seVars, reqVars, secrets, collectionVars)
     : undefined;

   const headers: Record<string, string> = {};

   // Handle SHELL requests
   if (request.method === 'SHELL') {
     let shellResult: { output: string; error: string };
     try {
       const { stdout, stderr } = await execAsync(url, { timeout: 30000 });
       shellResult = { output: stdout, error: stderr };
     } catch (err: any) {
       shellResult = { output: '', error: err.message };
     }
     
     return {
       id: request.id,
       name: request.name,
       status: shellResult.error ? 1 : 0,
       statusText: shellResult.error ? shellResult.error : 'Success',
       time: 0,
       error: shellResult.error,
     };
   }

   const effectiveAuth = request.auth?.type === 'inherit' ? parentAuth : request.auth;
   if (effectiveAuth) {
      applyAuthAndHeaders({ headers, url }, effectiveAuth, seVars, reqVars, secrets, collectionVars);
   }

   if (request.headers && Array.isArray(request.headers)) {
     for (const h of request.headers) {
        if (h.key && h.enabled) headers[h.key] = substituteAll(h.value, seVars, reqVars, secrets, collectionVars);
     }
   }

   setContentType(headers, request.body?.type || 'none', !!body);

   const result = await makeHttpRequest({
     method: request.method,
     url,
     headers,
     body,
   });

   return {
     id: request.id,
     name: request.name,
     status: result.status,
     statusText: result.statusText,
     time: result.time,
     error: result.error,
   };
 }

function applyAuthAndHeaders(
  opts: { headers: Record<string, string>; url: string },
  auth: Auth | undefined,
  seVars: VariableData[],
  reqVars: VariableData[],
  secrets?: { name: string; value: string }[],
  collectionVars?: VariableData[],
): void {
  if (!auth) return;

  if (auth.type === 'bearer' && auth.bearerToken) {
    opts.headers['Authorization'] = `Bearer ${substituteAll(auth.bearerToken, seVars, reqVars, secrets, collectionVars)}`;
  } else if (auth.type === 'basic' && auth.username && auth.password) {
      const u = substituteAll(auth.username, seVars, reqVars, secrets, collectionVars);
      const p = substituteAll(auth.password, seVars, reqVars, secrets, collectionVars);
    opts.headers['Authorization'] = `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
  } else if (auth.type === 'ntlm' && auth.ntlm) {
      const domain = substituteAll(auth.ntlm.domain || '', seVars, reqVars, secrets, collectionVars);
      const username = substituteAll(auth.ntlm.username || '', seVars, reqVars, secrets, collectionVars);
      const password = substituteAll(auth.ntlm.password || '', seVars, reqVars, secrets, collectionVars);
    const credentials = domain ? `${domain}\\${username}` : username;
    opts.headers['Authorization'] = `NTLM ${credentials}:${password}`;
  } else if (auth.type === 'oauth2' && auth.oauth2) {
    if (auth.oauth2.accessToken) {
      opts.headers['Authorization'] = `Bearer ${auth.oauth2.accessToken}`;
    }
  } else if (auth.type === 'apikey' && auth.apikey) {
      const k = substituteAll(auth.apikey.key, seVars, reqVars, secrets, collectionVars);
      const v = substituteAll(auth.apikey.value, seVars, reqVars, secrets, collectionVars);
    if (auth.apikey.in === 'header') {
      opts.headers[k] = v;
    } else {
      const urlObj = new URL(opts.url);
      urlObj.searchParams.set(k, v);
      opts.url = urlObj.toString();
    }
  }
}

function setContentType(headers: Record<string, string>, bodyType: string, hasBody: boolean): void {
   if (!hasBody) return;
   if (bodyType === 'json') headers['Content-Type'] = 'application/json';
   else if (bodyType === 'xml') headers['Content-Type'] = 'application/xml';
   else if (bodyType === 'text') headers['Content-Type'] = 'text/plain';
   else if (bodyType === 'x-www-form-urlencoded') headers['Content-Type'] = 'application/x-www-form-urlencoded';
   else if (bodyType === 'form-data') headers['Content-Type'] = 'multipart/form-data';
   else if (bodyType === 'graphql') headers['Content-Type'] = 'application/json';
   else if (bodyType === 'grpc') headers['Content-Type'] = 'application/grpc-web+proto';
 }

function resolveEnvVars(envStore: EnvironmentsStoreData): VariableData[] {
  const active = envStore.environments.find((e) => e.id === envStore.activeEnvironmentId);
  return active ? active.variables : [];
}

function resolveCollectionVars(
  collStore: CollectionsStoreData | undefined,
  envStore: EnvironmentsStoreData,
  collectionId?: string | null,
): VariableData[] {
  if (!collStore || !collectionId) return [];
  const collection = collStore.collections.find((c) => c.id === collectionId);
  const activeEnvironmentId = envStore.activeEnvironmentId;
  return (collection?.variables || []).filter((v) => v.enabled !== false && (!v.env || v.env === activeEnvironmentId));
}

function resolveRequestVars(envStore: EnvironmentsStoreData, variables: VariableData[] | undefined): VariableData[] {
  const activeEnvironmentId = envStore.activeEnvironmentId;
  return (variables || []).filter((v) => v.enabled !== false && (!v.env || v.env === activeEnvironmentId));
}

function buildRequestCollectionMap(collections: { id: string; items: any[] }[]): Map<string, string> {
  const map = new Map<string, string>();
  const visitItems = (items: any[], collectionId: string) => {
    for (const item of items || []) {
      if (item.method) {
        map.set(item.id, collectionId);
      }
      if (item.items && Array.isArray(item.items)) {
        visitItems(item.items, collectionId);
      }
    }
  };
  collections.forEach((collection) => visitItems(collection.items || [], collection.id));
  return map;
}

export async function sendRequest(context: SendRequestContext, rps: number = 0, requestId: string = ''): Promise<SendRequestResult> {
  const {
    requestsStore,
    responseStore: _responseStore,
    historyStore: _historyStore,
    environmentsStore,
    appStore,
    collectionsStore,
    secretsStore,
  } = context;

  const reqStore = requestsStore as RequestsStoreData;
  const envStore = environmentsStore as EnvironmentsStoreData;
  const appData = appStore as AppStoreData;
  const secStore = secretsStore as SecretsStoreData | undefined;
  const collStore = collectionsStore as CollectionsStoreData | undefined;

  let mainRequest = reqStore.currentRequest;

  const seVars = resolveEnvVars(envStore);
  const secrets = appData.secrets;
  const secUnlocked = secStore?.isUnlocked ?? false;
  const accessibleSecrets = secUnlocked ? secrets : undefined;

  const requestMapper = collStore ? flatRequests(collStore.collections.flatMap((c: any) => c.items || [])) : new Map<string, any>();
  const requestCollectionMap = collStore ? buildRequestCollectionMap(collStore.collections) : new Map<string, string>();
  const resolveRequestCollectionVars = (request: RequestSnapshot) => {
    const collectionId = requestCollectionMap.get(request.id) || collStore?.selectedCollectionId;
    return resolveCollectionVars(collStore, envStore, collectionId);
  };
  const executedIds = new Set<string>();
  const executedDeps: ExecutedRequest[] = [];
  const historyEntries: unknown[] = [];

  async function resolveAndRunDep(depId: string, parentAuth?: Auth): Promise<void> {
    if (executedIds.has(depId)) return;

    const depRequest = requestMapper.get(depId);
    if (!depRequest) return;

    if (depRequest.dependsOn && depRequest.dependsOn !== depId) {
      await resolveAndRunDep(depRequest.dependsOn, depRequest.auth?.type === 'inherit' ? parentAuth : depRequest.auth);
    }

    const reqVars = resolveRequestVars(envStore, depRequest.variables);
    const depCollectionVars = resolveRequestCollectionVars(depRequest);
    const result = await executeDepRequest(depRequest, seVars, reqVars, accessibleSecrets, depCollectionVars,
      depRequest.auth?.type === 'inherit' ? parentAuth : depRequest.auth
    );
    executedIds.add(depId);
    executedDeps.push(result);

    historyEntries.push({
      id: Date.now() + executedIds.size,
      method: depRequest.method,
      url: result.status !== 0 && result.time !== undefined ? mainRequest.url : depRequest.url,
      status: result.status,
      time: result.time,
      timestamp: Date.now(),
      request: depRequest,
      response: {
        status: result.status,
        statusText: result.statusText,
        data: '',
        time: result.time,
        headers: {},
        error: result.error,
      },
    });
  }

  const mainCollection = collStore
    ? collStore.collections.find((c: any) => c.id === requestCollectionMap.get(mainRequest.id) || c.id === collStore.selectedCollectionId)
    : undefined;
  const parentAuth = mainRequest.auth?.type === 'inherit' ? mainCollection?.auth as Auth : undefined;

  if (mainRequest.dependsOn) {
    await resolveAndRunDep(mainRequest.dependsOn, parentAuth);
  }

  const mainCollectionVars = resolveRequestCollectionVars(mainRequest);
  const requestVars = resolveRequestVars(envStore, mainRequest.variables);

  let url = substituteAll(mainRequest.url, seVars, requestVars, accessibleSecrets, mainCollectionVars);
  let body = mainRequest.body && mainRequest.body.type !== 'none' && mainRequest.body.content
    ? substituteAll(mainRequest.body.content, seVars, requestVars, accessibleSecrets, mainCollectionVars)
    : undefined;

  const headers: Record<string, string> = {};

  const substRequest = JSON.parse(JSON.stringify(mainRequest));
  substRequest.variables = requestVars;
  substRequest.url = url;
  if (body !== undefined) substRequest.body.content = body;

  if (substRequest.auth) {
    const a = substRequest.auth;
    if (a.type === 'bearer' && a.bearerToken) a.bearerToken = substituteAll(a.bearerToken, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
    else if (a.type === 'basic') {
      if (a.username) a.username = substituteAll(a.username, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.password) a.password = substituteAll(a.password, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
    } else if (a.type === 'clientcertificate' && a.clientCertificate) {
      if (a.clientCertificate.type === 'pkcs12' && a.clientCertificate.filePath) a.clientCertificate.filePath = substituteAll(a.clientCertificate.filePath, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.clientCertificate.passphrase) a.clientCertificate.passphrase = substituteAll(a.clientCertificate.passphrase, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.clientCertificate.type === 'pem') {
        if (a.clientCertificate.certPath) a.clientCertificate.certPath = substituteAll(a.clientCertificate.certPath, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
        if (a.clientCertificate.keyPath) a.clientCertificate.keyPath = substituteAll(a.clientCertificate.keyPath, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      }
    } else if (a.type === 'ntlm' && a.ntlm) {
      if (a.ntlm.domain) a.ntlm.domain = substituteAll(a.ntlm.domain, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.ntlm.username) a.ntlm.username = substituteAll(a.ntlm.username, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.ntlm.password) a.ntlm.password = substituteAll(a.ntlm.password, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
    } else if (a.type === 'oauth2' && a.oauth2) {
      if (a.oauth2.tokenUrl) a.oauth2.tokenUrl = substituteAll(a.oauth2.tokenUrl, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.clientId) a.oauth2.clientId = substituteAll(a.oauth2.clientId, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.clientSecret) a.oauth2.clientSecret = substituteAll(a.oauth2.clientSecret, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.scope) a.oauth2.scope = substituteAll(a.oauth2.scope, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.username) a.oauth2.username = substituteAll(a.oauth2.username, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.password) a.oauth2.password = substituteAll(a.oauth2.password, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.refreshToken) a.oauth2.refreshToken = substituteAll(a.oauth2.refreshToken, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      if (a.oauth2.accessToken) a.oauth2.accessToken = substituteAll(a.oauth2.accessToken, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
    } else if (a.type === 'apikey' && a.apikey) {
      a.apikey.key = substituteAll(a.apikey.key, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
      a.apikey.value = substituteAll(a.apikey.value, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars);
    }
  }

  if (substRequest.headers) {
    substRequest.headers.forEach((h: any) => { if (h.value) h.value = substituteAll(h.value, seVars, [...(substRequest.variables || [])], accessibleSecrets, mainCollectionVars); });
  }

  const resolveAuth = (): Auth | undefined => {
    if (!mainRequest.auth || mainRequest.auth.type === 'inherit') {
      return mainCollection?.auth as Auth;
    }
    return mainRequest.auth;
  };

  // Handle SHELL requests
  if (mainRequest.method === 'SHELL') {
    const command = substituteAll(mainRequest.url, seVars, requestVars, accessibleSecrets, mainCollectionVars);
    
    let shellResult: { output: string; error: string };
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
      shellResult = { output: stdout, error: stderr };
    } catch (err: any) {
      shellResult = { output: '', error: err.message };
    }
    
    let consoleLogs: string[] = [];

    // Run pre-request script with console capture
    if (mainRequest.preRequestScript) {
      try {
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          consoleLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
        };
        const scriptFn = new Function(mainRequest.preRequestScript);
        scriptFn();
        console.log = originalLog;
      } catch (err: any) {
        shellResult = { ...shellResult, error: (shellResult.error + '\n[Pre-request] ' + (err.message || err)).trim() };
      }
    }

    // Run post-request script with console capture
    if (mainRequest.postRequestScript && shellResult.output) {
      try {
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          consoleLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
        };
        const hs = { output: shellResult.output };
        const scriptFn = new Function('hs', mainRequest.postRequestScript);
        scriptFn(hs);
        console.log = originalLog;
      } catch (err: any) {
        shellResult = { ...shellResult, error: (shellResult.error + '\n[Post-request] ' + (err.message || err)).trim() };
      }
    }

    const now = Date.now();
    historyEntries.push({
      id: now,
      method: 'SHELL',
      url: command,
      status: shellResult.error ? 1 : 0,
      time: 0,
      timestamp: now,
      request: { ...mainRequest, url: command },
      response: {
        status: shellResult.error ? 1 : 0,
        statusText: shellResult.error ? shellResult.error : 'Success',
        data: shellResult.output,
        time: 0,
        headers: {},
        error: shellResult.error,
        consoleOutput: consoleLogs.join('\n') || undefined,
      },
    });

    return {
      response: {
        status: shellResult.error ? 1 : 0,
        statusText: shellResult.error ? shellResult.error : 'Success',
        data: shellResult.output,
        time: 0,
        headers: {},
        error: shellResult.error,
        consoleOutput: consoleLogs.join('\n') || undefined,
      },
      substitutedRequest: { ...mainRequest, url: command },
      executedDependencies: executedDeps,
      historyEntries,
      testResults: '',
      scriptSource: '',
    };
  }

  applyAuthAndHeaders({ headers, url }, resolveAuth(), seVars, [...(mainRequest.variables || [])], accessibleSecrets, mainCollectionVars);

  for (const h of reqStore.requestHeaders) {
    if (h.key && h.enabled) headers[h.key] = substituteAll(h.value, seVars, [...(mainRequest.variables || [])], accessibleSecrets, mainCollectionVars);
  }

  setContentType(headers, mainRequest.body?.type || 'none', !!body);

  const mainResult = await makeHttpRequest({
    method: mainRequest.method,
    url,
    headers,
    body,
    rps,
    requestId,
  });

  const now = Date.now();

  historyEntries.push({
    id: now,
    method: mainRequest.method,
    url,
    status: mainResult.status,
    time: mainResult.time,
    timestamp: now,
    request: substRequest,
    response: {
      status: mainResult.status,
      statusText: mainResult.statusText,
      data: mainResult.data,
      time: mainResult.time,
      headers: mainResult.headers,
      error: mainResult.error,
    },
  });

  let testResults = '';
  let scriptSource = '';
  if (mainRequest.testScript) {
    scriptSource = 'testScript';
    try {
      testResults = `Test script would execute:\n${mainRequest.testScript}`;
    } catch (scriptError: any) {
      testResults = `Test script error: ${scriptError.message}`;
    }
  }

  return {
    response: {
      status: mainResult.status,
      statusText: mainResult.statusText,
      data: mainResult.data,
      time: mainResult.time,
      headers: mainResult.headers,
      error: mainResult.error,
    },
    substitutedRequest: substRequest,
    executedDependencies: executedDeps,
    historyEntries,
    testResults,
    scriptSource,
  };
}